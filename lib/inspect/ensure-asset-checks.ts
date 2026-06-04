import { prisma } from "@/lib/prisma";

/** Create pending asset-check rows for each active register item on the building. */
export async function ensureInspectionAssetChecks(
  inspectionId: string,
  buildingId: string,
): Promise<void> {
  const assets = await prisma.buildingAsset.findMany({
    where: { buildingId, active: true },
    select: { id: true },
    orderBy: [{ assetType: "asc" }, { location: "asc" }],
  });
  if (assets.length === 0) return;

  const existing = await prisma.inspectionAssetCheck.findMany({
    where: { inspectionId },
    select: { buildingAssetId: true },
  });
  const existingIds = new Set(existing.map((row) => row.buildingAssetId));
  const missing = assets.filter((asset) => !existingIds.has(asset.id));
  if (missing.length === 0) return;

  await prisma.inspectionAssetCheck.createMany({
    data: missing.map((asset) => ({
      inspectionId,
      buildingAssetId: asset.id,
    })),
    skipDuplicates: true,
  });
}
