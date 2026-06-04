import type { Prisma } from "@prisma/client";
import { getBuildingById } from "@/lib/buildings/queries";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const buildingAssetSelect = {
  id: true,
  buildingId: true,
  assetType: true,
  tagNumber: true,
  barcodeValue: true,
  location: true,
  manufacturer: true,
  model: true,
  serialNumber: true,
  lastServiceAt: true,
  nextServiceDue: true,
  notes: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BuildingAssetSelect;

export type BuildingAssetRow = Prisma.BuildingAssetGetPayload<{
  select: typeof buildingAssetSelect;
}>;

export async function listBuildingAssets(
  session: DashboardSession,
  buildingId: string,
  options?: { includeInactive?: boolean },
): Promise<BuildingAssetRow[]> {
  const building = await getBuildingById(session, buildingId);
  if (!building) return [];

  return prisma.buildingAsset.findMany({
    where: {
      buildingId,
      ...(options?.includeInactive ? {} : { active: true }),
    },
    orderBy: [{ assetType: "asc" }, { location: "asc" }, { tagNumber: "asc" }],
    select: buildingAssetSelect,
  });
}

export async function getBuildingAssetInScope(
  session: DashboardSession,
  assetId: string,
): Promise<BuildingAssetRow | null> {
  const asset = await prisma.buildingAsset.findFirst({
    where: { id: assetId, building: { customer: { companyId: session.companyId } } },
    select: buildingAssetSelect,
  });
  if (!asset) return null;

  const building = await getBuildingById(session, asset.buildingId);
  if (!building) return null;

  return asset;
}
