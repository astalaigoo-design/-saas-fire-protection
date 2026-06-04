"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageJobs } from "@/lib/auth/permissions";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { applyInspectionScheduleUpdate } from "@/lib/scheduling/apply-inspection-schedule";
import {
  combineDateAndTime,
  parseDateInputValue,
  type CalendarMonth,
} from "@/lib/scheduling/calendar";
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

  const assigneeId = parsed.data.assignedToUserId ?? null;

  try {
    const result = await applyInspectionScheduleUpdate({
      session,
      inspectionId: parsed.data.inspectionId,
      scheduledAt,
      assignedToUserId: assigneeId,
    });
    if (!result.ok) return result;
  } catch (error) {
    captureServerActionError("updateInspectionJob", error);
    return { ok: false, error: "Could not update this job." };
  }

  const redirectMonth: CalendarMonth = {
    year: scheduledAt.getFullYear(),
    month: scheduledAt.getMonth() + 1,
  };

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/inspect/${parsed.data.inspectionId}`);
  redirect(`/dashboard/jobs?year=${redirectMonth.year}&month=${redirectMonth.month}&updated=1`);
}
