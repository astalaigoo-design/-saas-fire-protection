import { UserRole } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import { sendTechnicianJobEmail, type TechnicianJobEmailKind } from "@/lib/email/send-technician-job-email";
import { normalizeSmsPhone } from "@/lib/sms/normalize-phone";
import { sendTechnicianJobSms } from "@/lib/sms/send-technician-job-sms";
import { createStaffNotification } from "@/lib/notifications/create";
import { prisma } from "@/lib/prisma";
import { resolveRecurringAssignNotify } from "@/lib/scheduling/recurring-assign-notify";

const inspectionNotifySelect = {
  id: true,
  scheduledAt: true,
  assignedToUserId: true,
  assignedTo: {
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  },
  inspectionType: { select: { name: true } },
  company: { select: { name: true } },
  building: {
    select: { name: true, addressLine1: true, city: true },
  },
} as const;

export async function notifyTechnicianForInspection(input: {
  companyId: string;
  inspectionId: string;
  kind: TechnicianJobEmailKind;
  previousScheduledAt?: Date | null;
  occurrenceNote?: string | null;
  /** Skip first-only guard (calendar assign/reschedule, auto-schedule, quotes). */
  bypassRecurringSeriesGuard?: boolean;
  /** Known series size when batch-scheduling (avoids extra query). */
  knownSeriesOccurrenceCount?: number;
}): Promise<void> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: inspectionNotifySelect,
  });

  if (!inspection?.assignedToUserId || !inspection.assignedTo) return;
  if (inspection.assignedTo.role !== UserRole.technician) return;
  if (!inspection.assignedTo.active) return;

  let occurrenceNote = input.occurrenceNote ?? null;
  if (input.kind === "assigned" && !input.bypassRecurringSeriesGuard) {
    const decision = await resolveRecurringAssignNotify({
      companyId: input.companyId,
      inspectionId: input.inspectionId,
      knownOccurrenceCount: input.knownSeriesOccurrenceCount,
    });
    if (!decision.notify) return;
    occurrenceNote = occurrenceNote ?? decision.occurrenceNote;
  }

  const siteLabel = buildingLabel(inspection.building);
  const whenLabel = inspection.scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const inAppTitle =
    input.kind === "rescheduled"
      ? "Job rescheduled"
      : occurrenceNote
        ? "Recurring jobs scheduled"
        : "New job assigned to you";
  const inAppBody =
    input.kind === "rescheduled"
      ? `${inspection.inspectionType.name} at ${siteLabel} — now ${whenLabel}.`
      : `${inspection.inspectionType.name} at ${siteLabel} — ${whenLabel}.${occurrenceNote ? ` ${occurrenceNote}` : ""}`;

  await createStaffNotification({
    companyId: input.companyId,
    type: input.kind === "rescheduled" ? "inspection.rescheduled" : "inspection.assigned",
    title: inAppTitle,
    body: inAppBody,
    href: `/inspect/${inspection.id}`,
    entityType: "inspection",
    entityId: inspection.id,
    targetUserId: inspection.assignedTo.id,
  });

  const email = inspection.assignedTo.email?.trim();
  if (email) {
    const result = await sendTechnicianJobEmail({
      to: email,
      technicianName: inspection.assignedTo.name,
      companyName: inspection.company.name,
      kind: input.kind,
      inspectionTypeName: inspection.inspectionType.name,
      buildingLabel: siteLabel,
      scheduledAt: inspection.scheduledAt,
      previousScheduledAt: input.previousScheduledAt,
      inspectionId: inspection.id,
      occurrenceNote,
    });

    if (!result.ok) {
      console.error("sendTechnicianJobEmail failed", result.error, {
        inspectionId: inspection.id,
      });
    }
  } else {
    console.warn("notifyTechnicianForInspection: assignee has no email — skipping job email", {
      inspectionId: inspection.id,
      userId: inspection.assignedTo.id,
    });
  }

  const phoneRaw = inspection.assignedTo.phone?.trim();
  if (!phoneRaw) return;

  const toE164 = normalizeSmsPhone(phoneRaw);
  if (!toE164) {
    console.warn("notifyTechnicianForInspection: invalid technician phone", {
      inspectionId: inspection.id,
      userId: inspection.assignedTo.id,
    });
    return;
  }

  const sms = await sendTechnicianJobSms({
    toE164,
    kind: input.kind,
    inspectionTypeName: inspection.inspectionType.name,
    buildingLabel: siteLabel,
    scheduledAt: inspection.scheduledAt,
    inspectionId: inspection.id,
    companyName: inspection.company.name,
    occurrenceNote: input.kind === "assigned" ? occurrenceNote : null,
  });

  if (!sms.ok) {
    console.error("sendTechnicianJobSms failed", sms.error, {
      inspectionId: inspection.id,
    });
  }
}

/** Notify a technician they were removed from a job (reassigned to someone else or unassigned). */
export async function notifyTechnicianJobUnassigned(input: {
  companyId: string;
  inspectionId: string;
  previousAssigneeUserId: string;
  newAssigneeName?: string | null;
}): Promise<void> {
  const [inspection, previousAssignee] = await Promise.all([
    prisma.inspection.findFirst({
      where: { id: input.inspectionId, companyId: input.companyId },
      select: inspectionNotifySelect,
    }),
    prisma.user.findFirst({
      where: {
        id: input.previousAssigneeUserId,
        companyId: input.companyId,
        role: UserRole.technician,
      },
      select: { id: true, name: true, email: true, phone: true, active: true },
    }),
  ]);

  if (!inspection || !previousAssignee?.active) return;

  const siteLabel = buildingLabel(inspection.building);
  const whenLabel = inspection.scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const newName = input.newAssigneeName?.trim();
  const inAppBody = newName
    ? `${inspection.inspectionType.name} at ${siteLabel} on ${whenLabel} — now assigned to ${newName}.`
    : `${inspection.inspectionType.name} at ${siteLabel} on ${whenLabel} — removed from your schedule.`;

  await createStaffNotification({
    companyId: input.companyId,
    type: "inspection.unassigned",
    title: "Job reassigned",
    body: inAppBody,
    href: "/dashboard/my-jobs",
    entityType: "inspection",
    entityId: inspection.id,
    targetUserId: previousAssignee.id,
  });

  const email = previousAssignee.email?.trim();
  if (email) {
    const result = await sendTechnicianJobEmail({
      to: email,
      technicianName: previousAssignee.name,
      companyName: inspection.company.name,
      kind: "unassigned",
      inspectionTypeName: inspection.inspectionType.name,
      buildingLabel: siteLabel,
      scheduledAt: inspection.scheduledAt,
      inspectionId: inspection.id,
      newAssigneeName: newName ?? null,
    });

    if (!result.ok) {
      console.error("sendTechnicianJobEmail (unassigned) failed", result.error, {
        inspectionId: inspection.id,
        userId: previousAssignee.id,
      });
    }
  }

  const phoneRaw = previousAssignee.phone?.trim();
  if (!phoneRaw) return;

  const toE164 = normalizeSmsPhone(phoneRaw);
  if (!toE164) return;

  const sms = await sendTechnicianJobSms({
    toE164,
    kind: "unassigned",
    inspectionTypeName: inspection.inspectionType.name,
    buildingLabel: siteLabel,
    scheduledAt: inspection.scheduledAt,
    inspectionId: inspection.id,
    companyName: inspection.company.name,
    newAssigneeName: newName ?? null,
  });

  if (!sms.ok) {
    console.error("sendTechnicianJobSms (unassigned) failed", sms.error, {
      inspectionId: inspection.id,
      userId: previousAssignee.id,
    });
  }
}
