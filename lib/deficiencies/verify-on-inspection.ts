import { DeficiencyStatus, InspectionItemResult, InspectionStatus } from "@prisma/client";
import { deficiencyLabelKey } from "@/lib/deficiencies/label-key";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { prisma } from "@/lib/prisma";

export async function verifyDeficienciesOnPassedItems(input: {
  companyId: string;
  inspectionId: string;
  buildingId: string;
  actorUserId: string | null;
  completedAt: Date;
}): Promise<number> {
  const passedItems = await prisma.inspectionItem.findMany({
    where: {
      inspectionId: input.inspectionId,
      result: InspectionItemResult.pass,
    },
    select: { label: true },
  });

  if (passedItems.length === 0) return 0;

  const passKeys = new Set(passedItems.map((item) => deficiencyLabelKey(item.label)));

  const openDeficiencies = await prisma.deficiency.findMany({
    where: {
      companyId: input.companyId,
      buildingId: input.buildingId,
      status: {
        in: [DeficiencyStatus.open, DeficiencyStatus.owned, DeficiencyStatus.resolved],
      },
    },
    select: { id: true, label: true },
  });

  const toVerify = openDeficiencies.filter((row) =>
    passKeys.has(deficiencyLabelKey(row.label)),
  );

  if (toVerify.length === 0) return 0;

  const now = input.completedAt;
  await prisma.deficiency.updateMany({
    where: { id: { in: toVerify.map((row) => row.id) } },
    data: {
      status: DeficiencyStatus.verified,
      verifiedAt: now,
      verifiedInspectionId: input.inspectionId,
    },
  });

  for (const row of toVerify) {
    await writeAuditEvent({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      action: "deficiency.verified",
      entityType: "deficiency",
      entityId: row.id,
      metadata: {
        buildingId: input.buildingId,
        verifiedInspectionId: input.inspectionId,
        label: row.label,
      },
    });
  }

  return toVerify.length;
}

/** Ensures submit path only runs verification on completed inspections. */
export async function verifyDeficienciesAfterInspectionSubmit(input: {
  companyId: string;
  inspectionId: string;
  buildingId: string;
  actorUserId: string | null;
  completedAt: Date;
}): Promise<number> {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: input.inspectionId,
      companyId: input.companyId,
      status: InspectionStatus.completed,
    },
    select: { id: true },
  });
  if (!inspection) return 0;

  return verifyDeficienciesOnPassedItems(input);
}
