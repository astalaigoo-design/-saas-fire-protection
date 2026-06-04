import type { RecurrenceInterval } from "@prisma/client";
import { InspectionStatus } from "@prisma/client";
import { resolveInspectionChecklistCreateInputs } from "@/lib/inspections/resolve-checklist-items";
import { calculateNextInspectionDue } from "@/lib/reports/next-inspection-due";
import { resolveRecurrenceInterval } from "@/lib/scheduling/recurrence-policy";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { notifyTechnicianForInspection } from "@/lib/scheduling/notify-technician-job";
import { prisma } from "@/lib/prisma";

export type AutoScheduleNextResult =
  | { scheduled: true; inspectionId: string; scheduledAt: Date }
  | { scheduled: false; reason: string };

export async function autoScheduleNextInspection(input: {
  companyId: string;
  actorUserId: string | null;
  inspectionId: string;
  completedAt: Date;
}): Promise<AutoScheduleNextResult> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: {
      id: true,
      buildingId: true,
      inspectionTypeId: true,
      assignedToUserId: true,
      recurrenceGroupId: true,
      recurrenceInterval: true,
      notes: true,
      inspectionType: { select: { code: true, name: true } },
    },
  });

  if (!inspection) {
    return { scheduled: false, reason: "Inspection not found." };
  }

  const interval = resolveRecurrenceInterval(
    inspection.recurrenceInterval,
    inspection.inspectionType.code,
  );
  if (!interval) {
    return { scheduled: false, reason: "No recurring cadence for this inspection type." };
  }

  const existingFuture = await prisma.inspection.findFirst({
    where: {
      companyId: input.companyId,
      buildingId: inspection.buildingId,
      inspectionTypeId: inspection.inspectionTypeId,
      id: { not: input.inspectionId },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      scheduledAt: { gte: input.completedAt },
    },
    select: { id: true },
  });

  if (existingFuture) {
    return { scheduled: false, reason: "Next visit is already scheduled." };
  }

  const scheduledAt = calculateNextInspectionDue(
    input.completedAt,
    interval,
    inspection.inspectionType.code,
  );

  const checklistItems = await resolveInspectionChecklistCreateInputs(
    inspection.inspectionTypeId,
  );

  const created = await prisma.inspection.create({
    data: {
      companyId: input.companyId,
      buildingId: inspection.buildingId,
      inspectionTypeId: inspection.inspectionTypeId,
      assignedToUserId: inspection.assignedToUserId,
      scheduledAt,
      recurrenceGroupId: inspection.recurrenceGroupId,
      recurrenceInterval: interval,
      notes: inspection.notes,
      items: { create: checklistItems },
    },
    select: { id: true },
  });

  await syncBuildingComplianceStatus(inspection.buildingId);

  await writeAuditEvent({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: "inspection.auto_scheduled",
    entityType: "inspection",
    entityId: created.id,
    metadata: {
      previousInspectionId: input.inspectionId,
      scheduledAt: scheduledAt.toISOString(),
      cadence: interval,
    },
  });

  if (inspection.assignedToUserId) {
    await notifyTechnicianForInspection({
      companyId: input.companyId,
      inspectionId: created.id,
      kind: "assigned",
      bypassRecurringSeriesGuard: true,
    });
  }

  return { scheduled: true, inspectionId: created.id, scheduledAt };
}
