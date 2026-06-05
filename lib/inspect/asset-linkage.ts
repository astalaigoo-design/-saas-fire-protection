import { InspectionItemResult } from "@prisma/client";
import {
  buildAssetScanIndex,
  normalizeScanValue,
  type BuildingAssetScanRow,
} from "@/lib/assets/scan-match";
import { computeNextServiceDueForAsset } from "@/lib/assets/service-intervals";
import { ensureInspectionAssetChecks } from "@/lib/inspect/ensure-asset-checks";
import { prisma } from "@/lib/prisma";

export type ChecklistAssetLinkSource = {
  result: InspectionItemResult;
  linkedTagNumber: string | null;
  label: string;
  notes: string | null;
};

/** @deprecated Use normalizeScanValue from lib/assets/scan-match. */
export function normalizeEquipmentTag(tag: string): string {
  return normalizeScanValue(tag);
}

export function buildAssetTagIndex(assets: BuildingAssetScanRow[]): Map<string, string> {
  return buildAssetScanIndex(assets);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when normalized tag appears as a distinct token in text. */
export function textContainsEquipmentTag(text: string, normalizedTag: string): boolean {
  if (!normalizedTag) return false;
  const escaped = escapeRegExp(normalizedTag);
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(
    text.toLowerCase(),
  );
}

/** Resolve register asset for a checklist row (explicit tag, then label/notes match). */
export function resolveAssetIdForChecklistItem(
  item: ChecklistAssetLinkSource,
  tagIndex: Map<string, string>,
): string | null {
  const explicit = item.linkedTagNumber?.trim();
  if (explicit) {
    return tagIndex.get(normalizeEquipmentTag(explicit)) ?? null;
  }

  const entries = Array.from(tagIndex.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [tagKey, assetId] of entries) {
    if (
      textContainsEquipmentTag(item.label, tagKey) ||
      (item.notes && textContainsEquipmentTag(item.notes, tagKey))
    ) {
      return assetId;
    }
  }

  return null;
}

/** Asset IDs serviced on this visit (register pass + passed checklist linkage). */
export function collectServicedAssetIds(input: {
  items: ChecklistAssetLinkSource[];
  assetChecks: { buildingAssetId: string; result: InspectionItemResult }[];
  tagIndex: Map<string, string>;
}): string[] {
  const ids = new Set<string>();

  for (const check of input.assetChecks) {
    if (check.result === InspectionItemResult.pass) {
      ids.add(check.buildingAssetId);
    }
  }

  for (const item of input.items) {
    if (item.result !== InspectionItemResult.pass) continue;
    const assetId = resolveAssetIdForChecklistItem(item, input.tagIndex);
    if (assetId) ids.add(assetId);
  }

  return Array.from(ids);
}

/** Mark register rows pass when a linked checklist item passed (before submit validation). */
export async function syncAssetChecksFromChecklistPasses(input: {
  inspectionId: string;
  buildingId: string;
  items: ChecklistAssetLinkSource[];
}): Promise<void> {
  const assets = await prisma.buildingAsset.findMany({
    where: { buildingId: input.buildingId, active: true },
    select: { id: true, tagNumber: true, barcodeValue: true },
  });
  if (assets.length === 0) return;

  const tagIndex = buildAssetTagIndex(assets);
  const linkedAssetIds = new Set<string>();

  for (const item of input.items) {
    if (item.result !== InspectionItemResult.pass) continue;
    const assetId = resolveAssetIdForChecklistItem(item, tagIndex);
    if (assetId) linkedAssetIds.add(assetId);
  }

  if (linkedAssetIds.size === 0) return;

  await ensureInspectionAssetChecks(input.inspectionId, input.buildingId);

  const checks = await prisma.inspectionAssetCheck.findMany({
    where: { inspectionId: input.inspectionId },
    select: { id: true, buildingAssetId: true, result: true },
  });

  const toPass = checks.filter(
    (check) =>
      linkedAssetIds.has(check.buildingAssetId) &&
      check.result === InspectionItemResult.pending,
  );

  if (toPass.length === 0) return;

  await prisma.inspectionAssetCheck.updateMany({
    where: { id: { in: toPass.map((check) => check.id) } },
    data: { result: InspectionItemResult.pass },
  });
}

/** Stamp lastServiceAt (and servicedAt on checks) when a job completes. */
export async function applyInspectionAssetLinkageOnSubmit(input: {
  inspectionId: string;
  completedAt: Date;
}): Promise<void> {
  const inspection = await prisma.inspection.findUnique({
    where: { id: input.inspectionId },
    select: {
      buildingId: true,
      building: { select: { customer: { select: { branchId: true } } } },
    },
  });
  if (!inspection) return;

  const branchId = inspection.building.customer.branchId;

  const [items, assetChecks, assets] = await Promise.all([
    prisma.inspectionItem.findMany({
      where: { inspectionId: input.inspectionId },
      select: {
        result: true,
        linkedTagNumber: true,
        label: true,
        notes: true,
      },
    }),
    prisma.inspectionAssetCheck.findMany({
      where: { inspectionId: input.inspectionId },
      select: { id: true, buildingAssetId: true, result: true },
    }),
    prisma.buildingAsset.findMany({
      where: { buildingId: inspection.buildingId, active: true },
      select: { id: true, tagNumber: true, barcodeValue: true, assetType: true },
    }),
  ]);

  const tagIndex = buildAssetTagIndex(assets);
  const servicedAssetIds = collectServicedAssetIds({ items, assetChecks, tagIndex });
  if (servicedAssetIds.length === 0) return;

  const checkByAssetId = new Map(
    assetChecks.map((check) => [check.buildingAssetId, check]),
  );

  const checkUpdates: { id: string }[] = [];
  for (const assetId of servicedAssetIds) {
    const check = checkByAssetId.get(assetId);
    if (check) checkUpdates.push({ id: check.id });
  }

  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const assetUpdates = await Promise.all(
    servicedAssetIds.map(async (assetId) => {
      const asset = assetById.get(assetId);
      if (!asset) return null;
      const nextServiceDue = await computeNextServiceDueForAsset({
        branchId,
        assetType: asset.assetType,
        lastServiceAt: input.completedAt,
      });
      return {
        assetId,
        nextServiceDue,
      };
    }),
  );

  await prisma.$transaction([
    ...checkUpdates.map((check) =>
      prisma.inspectionAssetCheck.update({
        where: { id: check.id },
        data: {
          result: InspectionItemResult.pass,
          servicedAt: input.completedAt,
        },
      }),
    ),
    ...assetUpdates
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map((row) =>
        prisma.buildingAsset.update({
          where: { id: row.assetId },
          data: {
            lastServiceAt: input.completedAt,
            ...(row.nextServiceDue ? { nextServiceDue: row.nextServiceDue } : {}),
          },
        }),
      ),
  ]);
}

/** @deprecated Import from asset-linkage directly. */
export { applyInspectionAssetLinkageOnSubmit as applyAssetServiceStampOnSubmit };
