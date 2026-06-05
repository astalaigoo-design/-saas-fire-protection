import { InspectionStatus, UserRole } from "@prisma/client";
import {
  buildingAddressLine,
  buildingLabel,
  buildingMapsSearchQuery,
} from "@/lib/customers/format";
import {
  getDayOfSmsTimeZone,
  getZonedDayBounds,
  isSameZonedCalendarDay,
} from "@/lib/scheduling/day-of-timezone";
import { isSmsConfigured, OUTBOUND_SMS_NOT_CONFIGURED } from "@/lib/sms/env";
import { normalizeSmsPhone } from "@/lib/sms/normalize-phone";
import { sendTechnicianJobSms } from "@/lib/sms/send-technician-job-sms";
import { prisma } from "@/lib/prisma";

export type TechnicianDayOfSmsRunResult = {
  jobsConsidered: number;
  smsSent: number;
  skipped: number;
  errors: string[];
};

type DayOfInspectionRow = {
  id: string;
  companyId: string;
  scheduledAt: Date;
  technicianDayOfSmsSentAt: Date | null;
  inspectionType: { name: string };
  company: { name: string };
  building: {
    name: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  assignedTo: { id: string; phone: string | null } | null;
};

const dayOfInspectionSelect = {
  id: true,
  companyId: true,
  scheduledAt: true,
  technicianDayOfSmsSentAt: true,
  inspectionType: { select: { name: true } },
  company: { select: { name: true } },
  building: {
    select: {
      name: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postalCode: true,
      country: true,
    },
  },
  assignedTo: { select: { id: true, phone: true } },
} as const;

async function sendDayOfSmsForInspection(
  inspection: DayOfInspectionRow,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rawPhone = inspection.assignedTo?.phone?.trim();
  if (!rawPhone) {
    return { ok: false, error: "Technician has no phone number." };
  }

  const toE164 = normalizeSmsPhone(rawPhone);
  if (!toE164) {
    return { ok: false, error: "Invalid technician phone number." };
  }

  const sms = await sendTechnicianJobSms({
    toE164,
    kind: "day_of",
    inspectionTypeName: inspection.inspectionType.name,
    buildingLabel: buildingLabel(inspection.building),
    addressLine: buildingAddressLine(inspection.building),
    mapsQuery: buildingMapsSearchQuery(inspection.building),
    scheduledAt: inspection.scheduledAt,
    inspectionId: inspection.id,
    companyName: inspection.company.name,
  });

  if (!sms.ok) {
    return sms;
  }

  await prisma.inspection.update({
    where: { id: inspection.id },
    data: { technicianDayOfSmsSentAt: now },
  });

  return { ok: true };
}

/** Clear day-of SMS flag when the visit moves to a different calendar day. */
export function shouldResetTechnicianDayOfSmsSentAt(
  previousScheduledAt: Date,
  nextScheduledAt: Date,
  timeZone = getDayOfSmsTimeZone(),
): boolean {
  return !isSameZonedCalendarDay(previousScheduledAt, nextScheduledAt, timeZone);
}

/** Send day-of SMS for one inspection if it is scheduled today and not yet sent. */
export async function maybeSendTechnicianDayOfSms(
  inspectionId: string,
  now = new Date(),
): Promise<{ sent: boolean; skippedReason?: string; error?: string }> {
  if (!isSmsConfigured()) {
    return { sent: false, skippedReason: "sms_not_configured" };
  }

  const timeZone = getDayOfSmsTimeZone();
  const { start, end } = getZonedDayBounds(now, timeZone);

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      scheduledAt: { gte: start, lt: end },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      technicianDayOfSmsSentAt: null,
      assignedToUserId: { not: null },
      assignedTo: {
        role: UserRole.technician,
        active: true,
        phone: { not: null },
      },
    },
    select: dayOfInspectionSelect,
  });

  if (!inspection) {
    return { sent: false, skippedReason: "not_eligible" };
  }

  const result = await sendDayOfSmsForInspection(inspection, now);
  if (!result.ok) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

export async function sendTechnicianDayOfReminders(
  now = new Date(),
): Promise<TechnicianDayOfSmsRunResult> {
  const result: TechnicianDayOfSmsRunResult = {
    jobsConsidered: 0,
    smsSent: 0,
    skipped: 0,
    errors: [],
  };

  if (!isSmsConfigured()) {
    console.warn("technician-day-of cron:", OUTBOUND_SMS_NOT_CONFIGURED);
    result.errors.push(OUTBOUND_SMS_NOT_CONFIGURED);
    return result;
  }

  const { start, end } = getZonedDayBounds(now, getDayOfSmsTimeZone());

  const inspections = await prisma.inspection.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      technicianDayOfSmsSentAt: null,
      assignedToUserId: { not: null },
      assignedTo: {
        role: UserRole.technician,
        active: true,
        phone: { not: null },
      },
    },
    select: dayOfInspectionSelect,
  });

  result.jobsConsidered = inspections.length;

  for (const inspection of inspections) {
    const sent = await sendDayOfSmsForInspection(inspection, now);
    if (!sent.ok) {
      if (sent.error.includes("no phone") || sent.error.includes("Invalid")) {
        result.skipped += 1;
      }
      result.errors.push(`${inspection.id}: ${sent.error}`);
      continue;
    }

    result.smsSent += 1;
  }

  return result;
}
