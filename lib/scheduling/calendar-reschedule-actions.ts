"use server";

import { revalidatePath } from "next/cache";
import { canManageJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import { applyInspectionScheduleUpdate } from "@/lib/scheduling/apply-inspection-schedule";
import {
  bulkRescheduleInspectionsSchema,
  dragRescheduleInspectionSchema,
} from "@/lib/scheduling/calendar-reschedule-schemas";
import { moveScheduledToDate } from "@/lib/scheduling/move-scheduled-date";

export type CalendarRescheduleResult =
  | { ok: true; movedCount: number }
  | { ok: false; error: string };

export async function dragRescheduleInspection(input: {
  inspectionId: string;
  targetDate: string;
}): Promise<CalendarRescheduleResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageJobs(session.role)) {
    return { ok: false, error: "You do not have permission to reschedule jobs." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = dragRescheduleInspectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.inspection.findFirst({
    where: { id: parsed.data.inspectionId, companyId: session.companyId },
    select: { scheduledAt: true },
  });
  if (!existing) return { ok: false, error: "Job not found." };

  const scheduledAt = moveScheduledToDate(existing.scheduledAt, parsed.data.targetDate);
  if (!scheduledAt) return { ok: false, error: "Enter a valid date." };

  try {
    const result = await applyInspectionScheduleUpdate({
      session,
      inspectionId: parsed.data.inspectionId,
      scheduledAt,
    });
    if (!result.ok) return result;

    revalidatePath("/dashboard/jobs");
    revalidatePath(`/inspect/${parsed.data.inspectionId}`);
    return { ok: true, movedCount: result.scheduleChanged ? 1 : 0 };
  } catch (error) {
    captureServerActionError("dragRescheduleInspection", error);
    return { ok: false, error: "Could not reschedule this job." };
  }
}

export async function bulkRescheduleInspections(input: {
  inspectionIds: string[];
  targetDate: string;
}): Promise<CalendarRescheduleResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageJobs(session.role)) {
    return { ok: false, error: "You do not have permission to reschedule jobs." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = bulkRescheduleInspectionsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const scope = branchScopeFromSession(session);
  const uniqueIds = Array.from(new Set(parsed.data.inspectionIds));
  const rows = await prisma.inspection.findMany({
    where: {
      id: { in: uniqueIds },
      ...inspectionWhereFromScope(scope, session.companyId),
    },
    select: { id: true, scheduledAt: true },
  });

  if (rows.length !== uniqueIds.length) {
    return { ok: false, error: "One or more jobs were not found." };
  }

  let movedCount = 0;

  try {
    for (const row of rows) {
      const scheduledAt = moveScheduledToDate(row.scheduledAt, parsed.data.targetDate);
      if (!scheduledAt) {
        return { ok: false, error: "Enter a valid date." };
      }

      const result = await applyInspectionScheduleUpdate({
        session,
        inspectionId: row.id,
        scheduledAt,
      });
      if (!result.ok) return result;
      if (result.scheduleChanged) movedCount += 1;
      revalidatePath(`/inspect/${row.id}`);
    }
  } catch (error) {
    captureServerActionError("bulkRescheduleInspections", error);
    return { ok: false, error: "Could not reschedule selected jobs." };
  }

  revalidatePath("/dashboard/jobs");
  return { ok: true, movedCount };
}
