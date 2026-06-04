import { InspectionItemResult, InspectionStatus } from "@prisma/client";
import { resolveInspectionChecklistCreateInputs } from "@/lib/inspections/resolve-checklist-items";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { prisma } from "@/lib/prisma";

/** Days after a failed inspection to schedule the follow-up visit. */
export const FOLLOW_UP_INSPECTION_DAYS = 14;

/** Skip follow-up if another open visit is already scheduled within this window of the target date. */
const FOLLOW_UP_CONFLICT_DAYS = 7;

export type AutoScheduleFollowUpResult =
  | { scheduled: true; inspectionId: string; scheduledAt: Date }
  | { scheduled: false; reason: string };

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function inspectionHasFailedChecklistItems(
  items: { result: InspectionItemResult }[],
): boolean {
  return items.some((item) => item.result === InspectionItemResult.fail);
}

export async function autoScheduleFollowUpInspection(input: {
  companyId: string;
  actorUserId: string | null;
  inspectionId: string;
  completedAt: Date;
}): Promise<AutoScheduleFollowUpResult> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: {
      id: true,
      buildingId: true,
      inspectionTypeId: true,
      assignedToUserId: true,
      completedAt: true,
      inspectionType: { select: { code: true, name: true } },
      items: { select: { result: true } },
    },
  });

  if (!inspection) {
    return { scheduled: false, reason: "Inspection not found." };
  }

  if (!inspectionHasFailedChecklistItems(inspection.items)) {
    return { scheduled: false, reason: "Inspection has no failed checklist items." };
  }

  const followUpAt = addDays(input.completedAt, FOLLOW_UP_INSPECTION_DAYS);
  const conflictWindowEnd = addDays(followUpAt, FOLLOW_UP_CONFLICT_DAYS);

  const existingNearFollowUp = await prisma.inspection.findFirst({
    where: {
      companyId: input.companyId,
      buildingId: inspection.buildingId,
      inspectionTypeId: inspection.inspectionTypeId,
      id: { not: input.inspectionId },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      scheduledAt: {
        gte: input.completedAt,
        lte: conflictWindowEnd,
      },
    },
    select: { id: true },
  });

  if (existingNearFollowUp) {
    return { scheduled: false, reason: "A follow-up visit is already scheduled." };
  }

  const completedLabel = input.completedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const notes = `Follow-up for deficiencies from ${inspection.inspectionType.name} completed ${completedLabel}.`;

  const checklistItems = await resolveInspectionChecklistCreateInputs(
    inspection.inspectionTypeId,
  );

  const created = await prisma.inspection.create({
    data: {
      companyId: input.companyId,
      buildingId: inspection.buildingId,
      inspectionTypeId: inspection.inspectionTypeId,
      assignedToUserId: inspection.assignedToUserId,
      scheduledAt: followUpAt,
      notes,
      items: { create: checklistItems },
    },
    select: { id: true },
  });

  await syncBuildingComplianceStatus(inspection.buildingId);

  await writeAuditEvent({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: "inspection.follow_up_scheduled",
    entityType: "inspection",
    entityId: created.id,
    metadata: {
      parentInspectionId: input.inspectionId,
      scheduledAt: followUpAt.toISOString(),
      followUpDays: FOLLOW_UP_INSPECTION_DAYS,
    },
  });

  return { scheduled: true, inspectionId: created.id, scheduledAt: followUpAt };
}
