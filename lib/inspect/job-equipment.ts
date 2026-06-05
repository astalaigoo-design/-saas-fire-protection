import type { AssetType, InspectionItemResult } from "@prisma/client";
import { buildingAssetLabel } from "@/lib/assets/format";
import { prisma } from "@/lib/prisma";

export type JobEquipmentPreviewRow = {
  id: string;
  assetType: AssetType;
  tagNumber: string | null;
  location: string;
  lastServiceAt: Date | null;
  nextServiceDue: Date | null;
};

export type InspectionJobEquipmentRow = JobEquipmentPreviewRow & {
  checkId: string | null;
  result: InspectionItemResult | null;
  servicedAt: Date | null;
};

const assetSelect = {
  id: true,
  assetType: true,
  tagNumber: true,
  location: true,
  lastServiceAt: true,
  nextServiceDue: true,
} as const;

export async function listBuildingEquipmentPreview(
  buildingId: string,
): Promise<JobEquipmentPreviewRow[]> {
  return prisma.buildingAsset.findMany({
    where: { buildingId, active: true },
    orderBy: [{ assetType: "asc" }, { location: "asc" }],
    select: assetSelect,
  });
}

export async function listInspectionJobEquipment(
  inspectionId: string,
  buildingId: string,
): Promise<InspectionJobEquipmentRow[]> {
  const [assets, checks] = await Promise.all([
    listBuildingEquipmentPreview(buildingId),
    prisma.inspectionAssetCheck.findMany({
      where: { inspectionId },
      select: {
        id: true,
        buildingAssetId: true,
        result: true,
        servicedAt: true,
      },
    }),
  ]);

  const checkByAssetId = new Map(
    checks.map((check) => [check.buildingAssetId, check]),
  );

  return assets.map((asset) => {
    const check = checkByAssetId.get(asset.id);
    return {
      ...asset,
      checkId: check?.id ?? null,
      result: check?.result ?? null,
      servicedAt: check?.servicedAt ?? null,
    };
  });
}

export type ServiceRecordedRow = {
  id: string;
  label: string;
  location: string;
  servicedAt: Date;
};

/** Rows to show after submit — register pass + checklist-linked stamps. */
export function collectServiceRecordedRows(
  assetChecks: {
    result: InspectionItemResult;
    servicedAt: Date | null;
    buildingAsset: {
      id: string;
      assetType: AssetType;
      tagNumber: string | null;
      location: string;
    };
  }[],
): ServiceRecordedRow[] {
  return assetChecks
    .filter((check) => check.servicedAt != null)
    .map((check) => ({
      id: check.buildingAsset.id,
      label: buildingAssetLabel(check.buildingAsset),
      location: check.buildingAsset.location,
      servicedAt: check.servicedAt!,
    }));
}
