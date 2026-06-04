import { InspectionItemResult } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** On submit: stamp service date on passed assets and sync the building register. */
export async function applyAssetServiceStampOnSubmit(input: {
  inspectionId: string;
  completedAt: Date;
}): Promise<void> {
  const checks = await prisma.inspectionAssetCheck.findMany({
    where: { inspectionId: input.inspectionId },
    select: { id: true, buildingAssetId: true, result: true },
  });

  const passed = checks.filter((c) => c.result === InspectionItemResult.pass);
  if (passed.length === 0) return;

  await prisma.$transaction([
    ...passed.map((check) =>
      prisma.inspectionAssetCheck.update({
        where: { id: check.id },
        data: { servicedAt: input.completedAt },
      }),
    ),
    ...passed.map((check) =>
      prisma.buildingAsset.update({
        where: { id: check.buildingAssetId },
        data: { lastServiceAt: input.completedAt },
      }),
    ),
  ]);
}
