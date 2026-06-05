import { InspectionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  PORTAL_SCHEDULE_MAX_DAYS_AHEAD,
  PORTAL_TIME_SLOTS,
} from "@/lib/customers/portal-schedule-constants";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { resolveCompanyAccess } from "@/lib/billing/access";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { buildingLabel } from "@/lib/customers/format";
import { resolveInspectionChecklistCreateInputs } from "@/lib/inspections/resolve-checklist-items";
import { notifyInspectionScheduled } from "@/lib/notifications/notify-inspection-scheduled";
import { prisma } from "@/lib/prisma";
import {
  combineDateAndTime,
  parseDateInputValue,
  toDateInputValue,
} from "@/lib/scheduling/calendar";

export { PORTAL_SCHEDULE_MAX_DAYS_AHEAD, PORTAL_TIME_SLOTS } from "@/lib/customers/portal-schedule-constants";

export const portalScheduleRequestSchema = z.object({
  buildingId: z.string().trim().min(1, "Select a building"),
  inspectionTypeId: z.string().trim().min(1, "Select an inspection type"),
  scheduledDate: z.string().trim().min(1, "Date is required"),
  scheduledTime: z.enum(PORTAL_TIME_SLOTS, { message: "Select a preferred time." }),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type PortalScheduleRequestInput = z.infer<typeof portalScheduleRequestSchema>;

export type PortalScheduleResult =
  | {
      ok: true;
      inspectionId: string;
      scheduledAt: string;
      message: string;
    }
  | { ok: false; error: string };

export function portalScheduleMinDate(now = new Date()): string {
  const min = new Date(now);
  min.setDate(min.getDate() + 1);
  return toDateInputValue(min);
}

export function portalScheduleMaxDate(now = new Date()): string {
  const max = new Date(now);
  max.setDate(max.getDate() + PORTAL_SCHEDULE_MAX_DAYS_AHEAD);
  return toDateInputValue(max);
}

export function validatePortalScheduleDate(
  scheduledDate: string,
  now = new Date(),
): string | null {
  const date = parseDateInputValue(scheduledDate);
  if (!date) return "Enter a valid date.";

  const min = parseDateInputValue(portalScheduleMinDate(now));
  const max = parseDateInputValue(portalScheduleMaxDate(now));
  if (!min || !max) return "Enter a valid date.";

  if (date < min) return "Pick a date at least one day from today.";
  if (date > max) return `Pick a date within the next ${PORTAL_SCHEDULE_MAX_DAYS_AHEAD} days.`;
  return null;
}

export function portalScheduleDayBounds(scheduledAt: Date): { dayStart: Date; dayEnd: Date } {
  const dayStart = new Date(scheduledAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { dayStart, dayEnd };
}

export function buildPortalScheduleNotes(customerName: string, notes?: string): string {
  const prefix = `[Customer portal] ${customerName}`;
  if (!notes) return prefix;
  return `${prefix}\n${notes}`;
}

export async function scheduleInspectionFromPortal(
  portalToken: string,
  input: PortalScheduleRequestInput,
): Promise<PortalScheduleResult> {
  const customer = await prisma.customer.findFirst({
    where: { portalToken },
    select: {
      id: true,
      name: true,
      portalEnabledAt: true,
      companyId: true,
      company: {
        select: {
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionRenewsAt: true,
          designPartner: true,
        },
      },
    },
  });

  if (!customer?.portalEnabledAt) {
    return { ok: false, error: "This portal link is not available." };
  }

  const access = resolveCompanyAccess(customer.company);
  if (!access.hasAccess) {
    return { ok: false, error: "Scheduling is temporarily unavailable. Please contact the office." };
  }

  const dateError = validatePortalScheduleDate(input.scheduledDate);
  if (dateError) return { ok: false, error: dateError };

  const date = parseDateInputValue(input.scheduledDate);
  if (!date) return { ok: false, error: "Enter a valid date." };

  const scheduledAt = combineDateAndTime(date, input.scheduledTime);
  if (!scheduledAt) return { ok: false, error: "Select a valid time." };

  const building = await prisma.building.findFirst({
    where: { id: input.buildingId, customerId: customer.id },
    select: { id: true, name: true, addressLine1: true, city: true },
  });
  if (!building) {
    return { ok: false, error: "Building not found." };
  }

  const inspectionType = await prisma.inspectionType.findFirst({
    where: { id: input.inspectionTypeId, companyId: customer.companyId },
    select: { id: true, name: true },
  });
  if (!inspectionType) {
    return { ok: false, error: "Inspection type not found." };
  }

  const { dayStart, dayEnd } = portalScheduleDayBounds(scheduledAt);

  const conflicting = await prisma.inspection.findFirst({
    where: {
      buildingId: building.id,
      inspectionTypeId: inspectionType.id,
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      scheduledAt: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true },
  });
  if (conflicting) {
    return {
      ok: false,
      error: "An inspection of this type is already scheduled for that building on the selected day.",
    };
  }

  const checklistItems = await resolveInspectionChecklistCreateInputs(inspectionType.id);
  const notes = buildPortalScheduleNotes(customer.name, input.notes);

  let inspectionId: string;
  try {
    const created = await prisma.inspection.create({
      data: {
        companyId: customer.companyId,
        buildingId: building.id,
        inspectionTypeId: inspectionType.id,
        assignedToUserId: null,
        scheduledAt,
        notes,
        items: { create: checklistItems },
      },
      select: { id: true },
    });
    inspectionId = created.id;
  } catch {
    return { ok: false, error: "Could not schedule the inspection. Please try again." };
  }

  await syncBuildingComplianceStatus(building.id);

  await writeAuditEvent({
    companyId: customer.companyId,
    actorUserId: null,
    action: "inspection.scheduled_from_portal",
    entityType: "inspection",
    entityId: inspectionId,
    metadata: {
      customerId: customer.id,
      customerName: customer.name,
      buildingId: building.id,
      scheduledAt: scheduledAt.toISOString(),
      portalToken,
    },
  });

  await notifyInspectionScheduled({
    companyId: customer.companyId,
    inspectionId,
    occurrenceCount: 1,
    customerPortalRequest: { customerName: customer.name },
  });

  revalidatePath(`/portal/${portalToken}`);
  revalidatePath("/dashboard/jobs");

  const siteLabel = buildingLabel(building);
  return {
    ok: true,
    inspectionId,
    scheduledAt: scheduledAt.toISOString(),
    message: `${inspectionType.name} at ${siteLabel} is requested. Your contractor will confirm the visit.`,
  };
}
