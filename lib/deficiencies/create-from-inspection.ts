import { DeficiencyStatus, InspectionItemResult, InspectionStatus } from "@prisma/client";
import { cache } from "react";
import { deficiencyLabelKey } from "@/lib/deficiencies/label-key";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { FOLLOW_UP_INSPECTION_DAYS } from "@/lib/scheduling/auto-schedule-follow-up";
import { prisma } from "@/lib/prisma";

function defaultDueAt(from: Date): Date {
  const due = new Date(from);
  due.setDate(due.getDate() + FOLLOW_UP_INSPECTION_DAYS);
  return due;
}

export async function createDeficienciesFromFailedItems(input: {
  companyId: string;
  inspectionId: string;
  actorUserId: string | null;
  completedAt: Date;
}): Promise<number> {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: input.inspectionId,
      companyId: input.companyId,
      status: InspectionStatus.completed,
    },
    select: {
      id: true,
      buildingId: true,
      items: {
        where: { result: InspectionItemResult.fail },
        select: {
          id: true,
          label: true,
          description: true,
          notes: true,
        },
      },
    },
  });

  if (!inspection || inspection.items.length === 0) return 0;

  const existing = await prisma.deficiency.findMany({
    where: {
      buildingId: inspection.buildingId,
      status: { in: [DeficiencyStatus.open, DeficiencyStatus.owned, DeficiencyStatus.resolved] },
    },
    select: { label: true },
  });
  const openLabelKeys = new Set(existing.map((row) => deficiencyLabelKey(row.label)));

  let created = 0;
  for (const item of inspection.items) {
    const key = deficiencyLabelKey(item.label);
    if (openLabelKeys.has(key)) continue;

    const row = await prisma.deficiency.create({
      data: {
        companyId: input.companyId,
        buildingId: inspection.buildingId,
        inspectionItemId: item.id,
        sourceInspectionId: inspection.id,
        label: item.label,
        description: item.description,
        notes: item.notes,
        status: DeficiencyStatus.open,
        dueAt: defaultDueAt(input.completedAt),
      },
      select: { id: true },
    });

    openLabelKeys.add(key);
    created += 1;

    await writeAuditEvent({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      action: "deficiency.created",
      entityType: "deficiency",
      entityId: row.id,
      metadata: {
        buildingId: inspection.buildingId,
        inspectionItemId: item.id,
        label: item.label,
      },
    });

    try {
      const { emitDeficiencyCreatedWebhook } = await import("@/lib/integrations/emit");
      await emitDeficiencyCreatedWebhook(input.companyId, row.id);
    } catch (error) {
      console.error("emitDeficiencyCreatedWebhook failed", error);
    }
  }

  return created;
}

/** One-time backfill for failed items recorded before the deficiencies table existed. */
async function backfillDeficienciesForCompanyUncached(companyId: string): Promise<number> {
  const items = await prisma.inspectionItem.findMany({
    where: {
      result: InspectionItemResult.fail,
      deficiency: null,
      inspection: {
        companyId,
        status: InspectionStatus.completed,
        completedAt: { not: null },
      },
    },
    select: {
      id: true,
      label: true,
      description: true,
      notes: true,
      inspection: {
        select: {
          id: true,
          buildingId: true,
          completedAt: true,
        },
      },
    },
    take: 200,
  });

  let created = 0;
  for (const item of items) {
    const completedAt = item.inspection.completedAt;
    if (!completedAt) continue;

    const openDuplicate = await prisma.deficiency.findFirst({
      where: {
        buildingId: item.inspection.buildingId,
        status: { in: [DeficiencyStatus.open, DeficiencyStatus.owned, DeficiencyStatus.resolved] },
        label: { equals: item.label, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (openDuplicate) continue;

    await prisma.deficiency.create({
      data: {
        companyId,
        buildingId: item.inspection.buildingId,
        inspectionItemId: item.id,
        sourceInspectionId: item.inspection.id,
        label: item.label,
        description: item.description,
        notes: item.notes,
        status: DeficiencyStatus.open,
        dueAt: defaultDueAt(completedAt),
      },
    });
    created += 1;
  }

  return created;
}

/** Deduped per server request — command center calls this from multiple loaders. */
export const backfillDeficienciesForCompany = cache(backfillDeficienciesForCompanyUncached);
