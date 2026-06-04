"use server";

import { InspectionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import {
  combineDateAndTime,
  parseDateInputValue,
  type CalendarMonth,
} from "@/lib/scheduling/calendar";
import { notifyTechnicianForInspection } from "@/lib/scheduling/notify-technician-job";
import { updateInspectionJobSchema } from "@/lib/scheduling/update-inspection-job-schemas";

export type UpdateInspectionJobState =
  | { ok: true }
  | { ok: false; error: string };

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

export async function updateInspectionJob(
  _prev: UpdateInspectionJobState | undefined,
  formData: FormData,
): Promise<UpdateInspectionJobState> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageJobs(session.role)) {
    return { ok: false, error: "You do not have permission to update jobs." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = updateInspectionJobSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const date = parseDateInputValue(parsed.data.scheduledDate);
  if (!date) return { ok: false, error: "Enter a valid date." };

  const scheduledAt = combineDateAndTime(date, parsed.data.scheduledTime);
  if (!scheduledAt) return { ok: false, error: "Enter a valid time." };

  const scope = branchScopeFromSession(session);
  const before = await prisma.inspection.findFirst({
    where: {
      id: parsed.data.inspectionId,
      ...inspectionWhereFromScope(scope, session.companyId),
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

  const assigneeId = parsed.data.assignedToUserId ?? null;
  if (assigneeId) {
    const technician = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        companyId: session.companyId,
        role: "technician",
        active: true,
      },
      select: { id: true },
    });
    if (!technician) {
      return { ok: false, error: "Selected technician is not valid." };
    }
  }

  const scheduleChanged = before.scheduledAt.getTime() !== scheduledAt.getTime();
  const assigneeChanged = before.assignedToUserId !== assigneeId;

  if (!scheduleChanged && !assigneeChanged) {
    return { ok: true };
  }

  try {
    await prisma.inspection.update({
      where: { id: before.id },
      data: {
        scheduledAt,
        assignedToUserId: assigneeId,
      },
    });
  } catch (error) {
    captureServerActionError("updateInspectionJob", error);
    return { ok: false, error: "Could not update this job." };
  }

  if (assigneeChanged) {
    await writeAuditEvent({
      companyId: session.companyId,
      actorUserId: session.appUserId,
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
      companyId: session.companyId,
      actorUserId: session.appUserId,
      action: "inspection.rescheduled",
      entityType: "inspection",
      entityId: before.id,
      metadata: {
        previousScheduledAt: before.scheduledAt.toISOString(),
        scheduledAt: scheduledAt.toISOString(),
      },
    });
  }

  if (assigneeId) {
    if (assigneeChanged) {
      await notifyTechnicianForInspection({
        companyId: session.companyId,
        inspectionId: before.id,
        kind: "assigned",
      });
    } else if (scheduleChanged) {
      await notifyTechnicianForInspection({
        companyId: session.companyId,
        inspectionId: before.id,
        kind: "rescheduled",
        previousScheduledAt: before.scheduledAt,
      });
    }
  }

  const redirectMonth: CalendarMonth = {
    year: scheduledAt.getFullYear(),
    month: scheduledAt.getMonth() + 1,
  };

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/inspect/${before.id}`);
  redirect(`/dashboard/jobs?year=${redirectMonth.year}&month=${redirectMonth.month}&updated=1`);
}
