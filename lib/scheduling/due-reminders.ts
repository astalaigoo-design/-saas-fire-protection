import { UserRole } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import { sendDueReminderEmail } from "@/lib/email/send-due-reminder";
import { isReportEmailConfigured } from "@/lib/email/env";
import { computeDueInspections } from "@/lib/operations/due-inspections";
import {
  dueReminderBuildingWhere,
  dueReminderInspectionTypeWhere,
  dueReminderInspectionWhere,
} from "@/lib/scheduling/due-reminder-scope";
import { DUE_REMINDER_DAYS } from "@/lib/scheduling/recurrence-policy";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dueReminderKey(dueAt: Date, inspectionTypeCode: string): string {
  return `${inspectionTypeCode}:${startOfDay(dueAt).toISOString().slice(0, 10)}`;
}

/** Company-wide recipients — not limited to a branch (all owners + admins). */
async function getReminderRecipients(companyId: string): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { reportEmail: true, name: true },
  });

  const emails = new Set<string>();
  if (company?.reportEmail?.trim()) {
    emails.add(company.reportEmail.trim().toLowerCase());
  }

  const staff = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      role: { in: [UserRole.owner, UserRole.admin] },
      email: { not: null },
    },
    select: { email: true },
  });

  for (const user of staff) {
    if (user.email?.trim()) emails.add(user.email.trim().toLowerCase());
  }

  return Array.from(emails);
}

async function wasReminderSent(input: {
  companyId: string;
  buildingId: string;
  dueKey: string;
}): Promise<boolean> {
  const recent = await prisma.auditEvent.findMany({
    where: {
      companyId: input.companyId,
      action: "inspection.due_reminder_sent",
      entityType: "building",
      entityId: input.buildingId,
      createdAt: { gte: addDays(new Date(), -45) },
    },
    select: { metadata: true },
    take: 20,
  });

  return recent.some((event) => {
    const metadata = event.metadata as { dueKey?: string } | null;
    return metadata?.dueKey === input.dueKey;
  });
}

export type DueReminderRunResult = {
  companiesProcessed: number;
  remindersSent: number;
  skipped: number;
  errors: string[];
};

export async function sendDueInspectionReminders(
  now = new Date(),
): Promise<DueReminderRunResult> {
  if (!isReportEmailConfigured()) {
    return {
      companiesProcessed: 0,
      remindersSent: 0,
      skipped: 0,
      errors: ["Email is not configured."],
    };
  }

  const targetDay = startOfDay(addDays(now, DUE_REMINDER_DAYS));
  const result: DueReminderRunResult = {
    companiesProcessed: 0,
    remindersSent: 0,
    skipped: 0,
    errors: [],
  };

  const companies = await prisma.company.findMany({
    select: { id: true, name: true, reportEmail: true },
  });

  for (const company of companies) {
    result.companiesProcessed += 1;
    let companyRemindersSent = 0;
    let companyRemindersSkipped = 0;

    const recipients = await getReminderRecipients(company.id);
    if (recipients.length === 0) {
      result.skipped += 1;
      await writeAuditEvent({
        companyId: company.id,
        actorUserId: null,
        action: "automation.due_reminders_run",
        entityType: "company",
        entityId: company.id,
        metadata: {
          remindersSent: 0,
          remindersSkipped: 0,
          noRecipients: true,
          leadDays: DUE_REMINDER_DAYS,
        },
      });
      continue;
    }

    const [buildings, inspections, inspectionTypes] = await Promise.all([
      prisma.building.findMany({
        where: dueReminderBuildingWhere(company.id),
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.inspection.findMany({
        where: dueReminderInspectionWhere(company.id),
        select: {
          id: true,
          buildingId: true,
          status: true,
          scheduledAt: true,
          completedAt: true,
          recurrenceInterval: true,
          inspectionType: { select: { code: true, name: true } },
        },
      }),
      prisma.inspectionType.findMany({
        where: dueReminderInspectionTypeWhere(company.id),
        select: { code: true },
      }),
    ]);

    const typeCodes =
      inspectionTypes.length > 0
        ? inspectionTypes.map((type) => type.code)
        : ["monthly", "quarterly", "annual"];

    const dueRows = computeDueInspections({ buildings, inspections, typeCodes, now }).filter(
      (row) => row.status === "due_soon" && row.dueAt,
    );

    for (const row of dueRows) {
      if (!row.dueAt || startOfDay(row.dueAt).getTime() !== targetDay.getTime()) {
        continue;
      }

      const dueKey = dueReminderKey(row.dueAt, row.inspectionTypeCode);
      const alreadySent = await wasReminderSent({
        companyId: company.id,
        buildingId: row.buildingId,
        dueKey,
      });
      if (alreadySent) {
        result.skipped += 1;
        companyRemindersSkipped += 1;
        continue;
      }

      const sendResult = await sendDueReminderEmail({
        to: recipients,
        companyName: company.name,
        buildingLabel: row.buildingLabel,
        customerName: row.customerName,
        inspectionTypeName: row.inspectionTypeName,
        dueAt: row.dueAt,
        replyTo: company.reportEmail,
      });

      if (!sendResult.ok) {
        result.errors.push(`${company.name}: ${sendResult.error}`);
        continue;
      }

      await writeAuditEvent({
        companyId: company.id,
        actorUserId: null,
        action: "inspection.due_reminder_sent",
        entityType: "building",
        entityId: row.buildingId,
        metadata: {
          dueKey,
          dueAt: row.dueAt.toISOString(),
          inspectionTypeCode: row.inspectionTypeCode,
          inspectionTypeName: row.inspectionTypeName,
          buildingLabel: row.buildingLabel,
          sentTo: recipients[0] ?? null,
          recipients,
        },
      });

      result.remindersSent += 1;
      companyRemindersSent += 1;
    }

    await writeAuditEvent({
      companyId: company.id,
      actorUserId: null,
      action: "automation.due_reminders_run",
      entityType: "company",
      entityId: company.id,
      metadata: {
        remindersSent: companyRemindersSent,
        remindersSkipped: companyRemindersSkipped,
        leadDays: DUE_REMINDER_DAYS,
      },
    });
  }

  return result;
}
