import { SubscriptionStatus, UserRole } from "@prisma/client";
import { getAppOrigin } from "@/lib/app-url";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { sendTrialEndingEmail } from "@/lib/email/send-trial-ending-email";
import { isReportEmailConfigured } from "@/lib/email/env";
import {
  TRIAL_ENDING_REMINDER_DAYS,
  type TrialEndingReminderDays,
} from "@/lib/billing/trial-reminder-constants";
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

function trialEndKey(trialEndsAt: Date): string {
  return startOfDay(trialEndsAt).toISOString().slice(0, 10);
}

async function getOwnerEmails(companyId: string): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { reportEmail: true },
  });

  const emails = new Set<string>();
  if (company?.reportEmail?.trim()) {
    emails.add(company.reportEmail.trim().toLowerCase());
  }

  const owners = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      role: UserRole.owner,
      email: { not: null },
    },
    select: { email: true },
  });

  for (const owner of owners) {
    if (owner.email?.trim()) {
      emails.add(owner.email.trim().toLowerCase());
    }
  }

  return Array.from(emails);
}

async function wasTrialReminderSent(input: {
  companyId: string;
  daysBefore: TrialEndingReminderDays;
  trialEndKey: string;
}): Promise<boolean> {
  const recent = await prisma.auditEvent.findMany({
    where: {
      companyId: input.companyId,
      action: "billing.trial_reminder_sent",
      entityType: "company",
      entityId: input.companyId,
      createdAt: { gte: addDays(new Date(), -60) },
    },
    select: { metadata: true },
    take: 20,
  });

  return recent.some((event) => {
    const metadata = event.metadata as {
      daysBefore?: number;
      trialEndKey?: string;
    } | null;
    return (
      metadata?.daysBefore === input.daysBefore &&
      metadata?.trialEndKey === input.trialEndKey
    );
  });
}

export type TrialEndingReminderRunResult = {
  companiesProcessed: number;
  remindersSent: number;
  skipped: number;
  errors: string[];
};

export async function sendTrialEndingReminders(
  now = new Date(),
): Promise<TrialEndingReminderRunResult> {
  if (!isReportEmailConfigured()) {
    return {
      companiesProcessed: 0,
      remindersSent: 0,
      skipped: 0,
      errors: ["Email is not configured."],
    };
  }

  const billingUrl = `${getAppOrigin()}/dashboard/billing`;
  const result: TrialEndingReminderRunResult = {
    companiesProcessed: 0,
    remindersSent: 0,
    skipped: 0,
    errors: [],
  };

  const companies = await prisma.company.findMany({
    where: {
      designPartner: false,
      subscriptionStatus: SubscriptionStatus.trialing,
      trialEndsAt: { not: null, gt: now },
    },
    select: {
      id: true,
      name: true,
      trialEndsAt: true,
      reportEmail: true,
    },
  });

  for (const company of companies) {
    result.companiesProcessed += 1;
    let companyRemindersSent = 0;

    if (!company.trialEndsAt) {
      result.skipped += 1;
      await writeAuditEvent({
        companyId: company.id,
        actorUserId: null,
        action: "automation.trial_reminders_run",
        entityType: "company",
        entityId: company.id,
        metadata: { remindersSent: 0, skipped: true, reason: "no_trial_end" },
      });
      continue;
    }

    const endKey = trialEndKey(company.trialEndsAt);
    const trialEndDay = startOfDay(company.trialEndsAt).getTime();

    let daysBefore: TrialEndingReminderDays | null = null;
    for (const days of TRIAL_ENDING_REMINDER_DAYS) {
      if (startOfDay(addDays(now, days)).getTime() === trialEndDay) {
        daysBefore = days;
        break;
      }
    }

    if (daysBefore === null) {
      result.skipped += 1;
      await writeAuditEvent({
        companyId: company.id,
        actorUserId: null,
        action: "automation.trial_reminders_run",
        entityType: "company",
        entityId: company.id,
        metadata: { remindersSent: 0, skipped: true, reason: "not_due_today" },
      });
      continue;
    }

    const alreadySent = await wasTrialReminderSent({
      companyId: company.id,
      daysBefore,
      trialEndKey: endKey,
    });
    if (alreadySent) {
      result.skipped += 1;
      await writeAuditEvent({
        companyId: company.id,
        actorUserId: null,
        action: "automation.trial_reminders_run",
        entityType: "company",
        entityId: company.id,
        metadata: {
          remindersSent: 0,
          skipped: true,
          reason: "already_sent",
          daysBefore,
        },
      });
      continue;
    }

    const recipients = await getOwnerEmails(company.id);
    if (recipients.length === 0) {
      result.skipped += 1;
      result.errors.push(`${company.name}: no owner email on file.`);
      await writeAuditEvent({
        companyId: company.id,
        actorUserId: null,
        action: "automation.trial_reminders_run",
        entityType: "company",
        entityId: company.id,
        metadata: {
          remindersSent: 0,
          skipped: true,
          reason: "no_recipients",
          daysBefore,
        },
      });
      continue;
    }

    const sendResult = await sendTrialEndingEmail({
      to: recipients,
      companyName: company.name,
      trialEndsAt: company.trialEndsAt,
      daysBefore,
      billingUrl,
      replyTo: company.reportEmail,
    });

    if (!sendResult.ok) {
      result.errors.push(`${company.name}: ${sendResult.error}`);
      continue;
    }

    await writeAuditEvent({
      companyId: company.id,
      actorUserId: null,
      action: "billing.trial_reminder_sent",
      entityType: "company",
      entityId: company.id,
      metadata: {
        daysBefore,
        daysBeforeEnd: daysBefore,
        trialEndKey: endKey,
        trialEndsAt: company.trialEndsAt.toISOString(),
        sentTo: recipients[0] ?? null,
        recipients,
        messageIds: sendResult.messageIds,
      },
    });

    result.remindersSent += 1;
    companyRemindersSent += 1;

    await writeAuditEvent({
      companyId: company.id,
      actorUserId: null,
      action: "automation.trial_reminders_run",
      entityType: "company",
      entityId: company.id,
      metadata: {
        remindersSent: companyRemindersSent,
        daysBefore,
      },
    });
  }

  return result;
}
