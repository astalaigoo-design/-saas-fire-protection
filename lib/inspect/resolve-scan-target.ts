import { InspectionItemResult } from "@prisma/client";
import {
  buildAssetScanIndex,
  findAssetIdByScanValue,
  normalizeScanValue,
  type BuildingAssetScanRow,
} from "@/lib/assets/scan-match";
import { buildingAssetLabel } from "@/lib/assets/format";
import {
  resolveAssetIdForChecklistItem,
  type ChecklistAssetLinkSource,
} from "@/lib/inspect/asset-linkage";

export type InspectionScanTarget = {
  assetId: string | null;
  checklistItemId: string | null;
  assetCheckId: string | null;
  label: string;
};

type ScanChecklistItem = ChecklistAssetLinkSource & { id: string };

type ScanAssetCheck = {
  id: string;
  asset: BuildingAssetScanRow & {
    assetType: import("@prisma/client").AssetType;
    location: string;
  };
};

export function buildInspectionScanIndex(
  assetChecks: ScanAssetCheck[],
): Map<string, string> {
  return buildAssetScanIndex(assetChecks.map((check) => check.asset));
}

function pickChecklistItemId(items: ScanChecklistItem[]): string | null {
  if (items.length === 0) return null;
  const pending = items.find((item) => item.result === InspectionItemResult.pending);
  return (pending ?? items[0]).id;
}

function matchingChecklistItems(
  scanValue: string,
  items: ScanChecklistItem[],
  scanIndex: Map<string, string>,
  assetId: string | null,
): ScanChecklistItem[] {
  const normalized = normalizeScanValue(scanValue);
  if (!normalized) return [];

  return items.filter((item) => {
    if (item.linkedTagNumber && normalizeScanValue(item.linkedTagNumber) === normalized) {
      return true;
    }
    if (!assetId) return false;
    return resolveAssetIdForChecklistItem(item, scanIndex) === assetId;
  });
}

/** Resolve a scanned tag/barcode to a checklist row and optional register row on this job. */
export function resolveInspectionScanTarget(input: {
  scanValue: string;
  items: ScanChecklistItem[];
  assetChecks: ScanAssetCheck[];
}): InspectionScanTarget | null {
  const trimmed = input.scanValue.trim();
  if (!trimmed) return null;

  const scanIndex = buildInspectionScanIndex(input.assetChecks);
  let assetId = findAssetIdByScanValue(trimmed, scanIndex);

  let checklistMatches = matchingChecklistItems(trimmed, input.items, scanIndex, assetId);

  if (!assetId && checklistMatches.length > 0) {
    for (const item of checklistMatches) {
      const resolved = resolveAssetIdForChecklistItem(item, scanIndex);
      if (resolved) {
        assetId = resolved;
        break;
      }
    }
  }

  if (!assetId) {
    assetId = findAssetIdByScanValue(trimmed, scanIndex);
  }

  if (assetId) {
    checklistMatches = matchingChecklistItems(trimmed, input.items, scanIndex, assetId);
  }

  const assetCheck = assetId
    ? input.assetChecks.find((check) => check.asset.id === assetId)
    : undefined;

  if (!assetCheck && checklistMatches.length === 0) {
    return null;
  }

  const checklistItemId = pickChecklistItemId(checklistMatches);
  const label = assetCheck
    ? buildingAssetLabel({
        assetType: assetCheck.asset.assetType,
        tagNumber: assetCheck.asset.tagNumber,
        location: assetCheck.asset.location,
      })
    : (checklistMatches[0]?.label ?? trimmed);

  return {
    assetId: assetId ?? null,
    checklistItemId,
    assetCheckId: assetCheck?.id ?? null,
    label,
  };
}
