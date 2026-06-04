import { InspectionStatus, UserRole } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import { isSmsConfigured, OUTBOUND_SMS_NOT_CONFIGURED } from "@/lib/sms/env";
import { normalizeSmsPhone } from "@/lib/sms/normalize-phone";
import { sendTechnicianJobSms } from "@/lib/sms/send-technician-job-sms";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

export type TechnicianDayOfSmsRunResult = {
  jobsConsidered: number;
  smsSent: number;
  skipped: number;
  errors: string[];
};

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

  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const inspections = await prisma.inspection.findMany({
    where: {
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      technicianDayOfSmsSentAt: null,
      assignedToUserId: { not: null },
      assignedTo: {
        role: UserRole.technician,
        active: true,
        phone: { not: null },
      },
    },
    select: {
      id: true,
      companyId: true,
      scheduledAt: true,
      inspectionType: { select: { name: true } },
      company: { select: { name: true } },
      building: {
        select: { name: true, addressLine1: true, city: true },
      },
      assignedTo: { select: { id: true, phone: true } },
    },
  });

  result.jobsConsidered = inspections.length;

  for (const inspection of inspections) {
    const rawPhone = inspection.assignedTo?.phone?.trim();
    if (!rawPhone) {
      result.skipped += 1;
      continue;
    }

    const toE164 = normalizeSmsPhone(rawPhone);
    if (!toE164) {
      result.skipped += 1;
      result.errors.push(`Invalid phone for inspection ${inspection.id}`);
      continue;
    }

    const sms = await sendTechnicianJobSms({
      toE164,
      kind: "day_of",
      inspectionTypeName: inspection.inspectionType.name,
      buildingLabel: buildingLabel(inspection.building),
      scheduledAt: inspection.scheduledAt,
      inspectionId: inspection.id,
      companyName: inspection.company.name,
    });

    if (!sms.ok) {
      result.errors.push(`${inspection.id}: ${sms.error}`);
      continue;
    }

    await prisma.inspection.update({
      where: { id: inspection.id },
      data: { technicianDayOfSmsSentAt: now },
    });

    result.smsSent += 1;
  }

  return result;
}
