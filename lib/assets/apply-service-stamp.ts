import type { AssetType } from "@prisma/client";
import { computeNextServiceDueForAsset } from "@/lib/assets/service-intervals";
import { prisma } from "@/lib/prisma";

/** Advance lastServiceAt and nextServiceDue for register rows serviced on a visit. */
export async function stampBuildingAssetsServiced(input: {
  buildingId: string;
  branchId: string;
  assetIds: string[];
  servicedAt: Date;
}): Promise<number> {
  const uniqueIds = Array.from(new Set(input.assetIds));
  if (uniqueIds.length === 0) return 0;

  const assets = await prisma.buildingAsset.findMany({
    where: {
      id: { in: uniqueIds },
      buildingId: input.buildingId,
      active: true,
    },
    select: { id: true, assetType: true },
  });

  if (assets.length === 0) return 0;

  const updates = await Promise.all(
    assets.map(async (asset) => ({
      assetId: asset.id,
      nextServiceDue: await computeNextServiceDueForAsset({
        branchId: input.branchId,
        assetType: asset.assetType as AssetType,
        lastServiceAt: input.servicedAt,
      }),
    })),
  );

  await prisma.$transaction(
    updates.map((row) =>
      prisma.buildingAsset.update({
        where: { id: row.assetId },
        data: {
          lastServiceAt: input.servicedAt,
          ...(row.nextServiceDue ? { nextServiceDue: row.nextServiceDue } : {}),
        },
      }),
    ),
  );

  return updates.length;
}
