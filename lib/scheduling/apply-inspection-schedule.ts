import { InspectionStatus } from "@prisma/client";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { prisma } from "@/lib/prisma";
import {
  notifyTechnicianForInspection,
  notifyTechnicianJobUnassigned,
} from "@/lib/scheduling/notify-technician-job";
import { shouldResetTechnicianDayOfSmsSentAt } from "@/lib/scheduling/technician-day-of-reminders";

export type ApplyInspectionScheduleInput = {
  session: DashboardSession;
  inspectionId: string;
  scheduledAt: Date;
  /** Omit to leave assignee unchanged. */
  assignedToUserId?: string | null;
};

export type ApplyInspectionScheduleResult =
  | {
      ok: true;
      scheduleChanged: boolean;
      assigneeChanged: boolean;
      buildingId: string;
      scheduledAt: Date;
    }
  | { ok: false; error: string };

export async function applyInspectionScheduleUpdate(
  input: ApplyInspectionScheduleInput,
): Promise<ApplyInspectionScheduleResult> {
  const scope = branchScopeFromSession(input.session);
  const before = await prisma.inspection.findFirst({
    where: {
      id: input.inspectionId,
      ...inspectionWhereFromScope(scope, input.session.companyId),
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
    },
    select: {
      id: true,
      scheduledAt: true,
      assignedToUserId: true,
      buildingId: true,
    },
  });

  if (!before) {
    return { ok: false, error: "Job not found or cannot be edited." };
  }

  const assigneeProvided = input.assignedToUserId !== undefined;
  const assigneeId = assigneeProvided ? (input.assignedToUserId ?? null) : before.assignedToUserId;

  if (assigneeProvided && assigneeId) {
    const technician = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        companyId: input.session.companyId,
        role: "technician",
        active: true,
      },
      select: { id: true },
    });
    if (!technician) {
      return { ok: false, error: "Selected technician is not valid." };
    }
  }

  const scheduleChanged = before.scheduledAt.getTime() !== input.scheduledAt.getTime();
  const assigneeChanged = assigneeProvided && before.assignedToUserId !== assigneeId;

  if (!scheduleChanged && !assigneeChanged) {
    return {
      ok: true,
      scheduleChanged: false,
      assigneeChanged: false,
      buildingId: before.buildingId,
      scheduledAt: input.scheduledAt,
    };
  }

  const resetDayOfSms =
    assigneeChanged ||
    (scheduleChanged &&
      shouldResetTechnicianDayOfSmsSentAt(before.scheduledAt, input.scheduledAt));

  await prisma.inspection.update({
    where: { id: before.id },
    data: {
      scheduledAt: input.scheduledAt,
      ...(assigneeProvided ? { assignedToUserId: assigneeId } : {}),
      ...(resetDayOfSms ? { technicianDayOfSmsSentAt: null } : {}),
    },
  });

  if (assigneeChanged) {
    await writeAuditEvent({
      companyId: input.session.companyId,
      actorUserId: input.session.appUserId,
      action: "inspection.assignee_changed",
      entityType: "inspection",
      entityId: before.id,
      metadata: {
        previousAssigneeId: before.assignedToUserId,
        assignedToUserId: assigneeId,
      },
    });
  }

  if (scheduleChanged) {
    await writeAuditEvent({
      companyId: input.session.companyId,
      actorUserId: input.session.appUserId,
      action: "inspection.rescheduled",
      entityType: "inspection",
      entityId: before.id,
      metadata: {
        previousScheduledAt: before.scheduledAt.toISOString(),
        scheduledAt: input.scheduledAt.toISOString(),
      },
    });
  }

  if (assigneeChanged && before.assignedToUserId) {
    const newAssignee = assigneeId
      ? await prisma.user.findFirst({
          where: { id: assigneeId, companyId: input.session.companyId },
          select: { name: true },
        })
      : null;

    await notifyTechnicianJobUnassigned({
      companyId: input.session.companyId,
      inspectionId: before.id,
      previousAssigneeUserId: before.assignedToUserId,
      newAssigneeName: newAssignee?.name ?? null,
    });
  }

  if (assigneeId) {
    if (assigneeChanged) {
      await notifyTechnicianForInspection({
        companyId: input.session.companyId,
        inspectionId: before.id,
        kind: "assigned",
        bypassRecurringSeriesGuard: true,
      });
    } else if (scheduleChanged) {
      await notifyTechnicianForInspection({
        companyId: input.session.companyId,
        inspectionId: before.id,
        kind: "rescheduled",
        previousScheduledAt: before.scheduledAt,
      });
    }
  }

  return {
    ok: true,
    scheduleChanged,
    assigneeChanged,
    buildingId: before.buildingId,
    scheduledAt: input.scheduledAt,
  };
}
