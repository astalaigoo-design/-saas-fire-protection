import { InspectionItemResult } from "@prisma/client";
import { stampBuildingAssetsServiced } from "@/lib/assets/apply-service-stamp";
import { buildAssetScanIndex, type BuildingAssetScanRow } from "@/lib/assets/scan-match";
import {
  resolveAssetIdForChecklistItem,
  type ChecklistAssetLinkSource,
} from "@/lib/inspect/asset-linkage";
import { prisma } from "@/lib/prisma";

export function resolveAssetIdForRepairCompletion(
  item: ChecklistAssetLinkSource,
  assets: BuildingAssetScanRow[],
): string | null {
  return resolveAssetIdForChecklistItem(
    { ...item, result: InspectionItemResult.pass },
    buildAssetScanIndex(assets),
  );
}

/** Stamp equipment register when a linked repair work order is marked complete. */
export async function applyWorkOrderAssetServiceOnComplete(
  workOrderId: string,
): Promise<number> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: {
      buildingId: true,
      completedAt: true,
      deficiency: {
        select: {
          inspectionItem: {
            select: {
              linkedTagNumber: true,
              label: true,
              notes: true,
            },
          },
        },
      },
      building: { select: { customer: { select: { branchId: true } } } },
    },
  });

  if (!workOrder?.deficiency) return 0;

  const servicedAt = workOrder.completedAt ?? new Date();
  const linkSource: ChecklistAssetLinkSource = {
    result: InspectionItemResult.pass,
    linkedTagNumber: workOrder.deficiency.inspectionItem.linkedTagNumber,
    label: workOrder.deficiency.inspectionItem.label,
    notes: workOrder.deficiency.inspectionItem.notes,
  };

  const assets = await prisma.buildingAsset.findMany({
    where: { buildingId: workOrder.buildingId, active: true },
    select: { id: true, tagNumber: true, barcodeValue: true },
  });

  const assetId = resolveAssetIdForRepairCompletion(linkSource, assets);
  if (!assetId) return 0;

  return stampBuildingAssetsServiced({
    buildingId: workOrder.buildingId,
    branchId: workOrder.building.customer.branchId,
    assetIds: [assetId],
    servicedAt,
  });
}
