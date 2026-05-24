"use server";

import { type RecurrenceInterval } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageJobs } from "@/lib/auth/permissions";
import { getDashboardSession } from "@/lib/dashboard/session";
import { buildInspectionChecklistItems } from "@/lib/inspections/build-checklist";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { prisma } from "@/lib/prisma";
import {
  combineDateAndTime,
  parseDateInputValue,
  type CalendarMonth,
} from "@/lib/scheduling/calendar";
import {
  buildRecurrenceSchedule,
  type RecurrenceOption,
} from "@/lib/scheduling/recurrence";
import { scheduleInspectionSchema } from "@/lib/scheduling/schemas";

export type ScheduleInspectionFormState =
  | { ok: true }
  | { ok: false; error: string };

function formDataToObject(formData: FormData): Record<string, string> {
  return {
    buildingId: String(formData.get("buildingId") ?? ""),
    inspectionTypeId: String(formData.get("inspectionTypeId") ?? ""),
    assignedToUserId: String(formData.get("assignedToUserId") ?? ""),
    scheduledDate: String(formData.get("scheduledDate") ?? ""),
    scheduledTime: String(formData.get("scheduledTime") ?? ""),
    recurrence: String(formData.get("recurrence") ?? "none"),
    notes: String(formData.get("notes") ?? ""),
  };
}

async function assertScheduleEntities(
  companyId: string,
  buildingId: string,
  inspectionTypeId: string,
  assignedToUserId: string | undefined,
): Promise<
  { ok: true; inspectionTypeCode: string } | { ok: false; error: string }
> {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, customer: { companyId } },
    select: { id: true },
  });
  if (!building) {
    return { ok: false, error: "Building not found for your company." };
  }

  const inspectionType = await prisma.inspectionType.findFirst({
    where: { id: inspectionTypeId, companyId },
    select: { id: true, code: true },
  });
  if (!inspectionType) {
    return { ok: false, error: "Inspection type not found." };
  }

  if (assignedToUserId) {
    const technician = await prisma.user.findFirst({
      where: { id: assignedToUserId, companyId, role: "technician", active: true },
      select: { id: true },
    });
    if (!technician) {
      return { ok: false, error: "Selected technician is not valid." };
    }
  }

  return { ok: true, inspectionTypeCode: inspectionType.code };
}

export async function scheduleInspection(
  _prev: ScheduleInspectionFormState | undefined,
  formData: FormData,
): Promise<ScheduleInspectionFormState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageJobs(session.role)) {
    return { ok: false, error: "You do not have permission to schedule inspections." };
  }

  const parsed = scheduleInspectionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: message };
  }

  const date = parseDateInputValue(parsed.data.scheduledDate);
  if (!date) {
    return { ok: false, error: "Enter a valid date." };
  }

  const scheduledAt = combineDateAndTime(date, parsed.data.scheduledTime);
  if (!scheduledAt) {
    return { ok: false, error: "Enter a valid time." };
  }

  const assignedToUserId =
    parsed.data.assignedToUserId && parsed.data.assignedToUserId !== ""
      ? parsed.data.assignedToUserId
      : undefined;

  const entityCheck = await assertScheduleEntities(
    session.companyId,
    parsed.data.buildingId,
    parsed.data.inspectionTypeId,
    assignedToUserId,
  );
  if (!entityCheck.ok) return entityCheck;

  const recurrence = parsed.data.recurrence as RecurrenceOption;
  const dates = buildRecurrenceSchedule(scheduledAt, recurrence);
  const recurrenceGroupId =
    recurrence === "none" ? null : crypto.randomUUID();
  const recurrenceInterval: RecurrenceInterval | null =
    recurrence === "none" ? null : recurrence;

  const checklistItems = buildInspectionChecklistItems(entityCheck.inspectionTypeCode);

  const redirectMonth: CalendarMonth = {
    year: scheduledAt.getFullYear(),
    month: scheduledAt.getMonth() + 1,
  };

  try {
    await prisma.$transaction(async (tx) => {
      for (const occurrenceDate of dates) {
        await tx.inspection.create({
          data: {
            companyId: session.companyId,
            buildingId: parsed.data.buildingId,
            inspectionTypeId: parsed.data.inspectionTypeId,
            assignedToUserId: assignedToUserId ?? null,
            scheduledAt: occurrenceDate,
            recurrenceGroupId,
            recurrenceInterval,
            notes: parsed.data.notes ?? null,
            items: { create: checklistItems },
          },
        });
      }
    });
  } catch (error) {
    console.error("scheduleInspection failed", error);
    return { ok: false, error: "Could not schedule inspection. Please try again." };
  }

  await syncBuildingComplianceStatus(parsed.data.buildingId);

  revalidatePath("/dashboard/jobs");
  redirect(
    `/dashboard/jobs?year=${redirectMonth.year}&month=${redirectMonth.month}&scheduled=1`,
  );
}
