import { formatDate, formatDateTime } from "@/lib/dashboard/dates";
import { DUE_REMINDER_DAYS } from "@/lib/scheduling/recurrence-policy";
import { prisma } from "@/lib/prisma";

const DUE_REMINDER_LOOKBACK_DAYS = 30;
const TRIAL_REMINDER_LOOKBACK_DAYS = 60;

export type AutomationRecentReminder = {
  id: string;
  createdAt: Date;
  buildingLabel: string | null;
  inspectionTypeName: string | null;
  dueAt: string | null;
  sentTo: string | null;
};

export type AutomationVisibility = {
  dueRemindersSentCount: number;
  trialRemindersSentCount: number;
  lastDueRemindersRunAt: Date | null;
  lastDueRemindersRunSent: number | null;
  lastTrialRemindersRunAt: Date | null;
  lastTrialRemindersRunSent: number | null;
  lastDueReminderSentAt: Date | null;
  recentDueReminders: AutomationRecentReminder[];
  leadDays: number;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function metaString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metaNumber(metadata: unknown, key: string): number | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

function firstRecipient(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const recipients = (metadata as Record<string, unknown>).recipients;
  if (!Array.isArray(recipients) || recipients.length === 0) return null;
  const first = recipients[0];
  return typeof first === "string" && first.trim() ? first.trim() : null;
}

export async function getAutomationVisibility(
  companyId: string,
): Promise<AutomationVisibility> {
  const now = new Date();
  const dueSince = addDays(now, DUE_REMINDER_LOOKBACK_DAYS);
  const trialSince = addDays(now, TRIAL_REMINDER_LOOKBACK_DAYS);

  const [
    dueRemindersSentCount,
    trialRemindersSentCount,
    lastDueRun,
    lastTrialRun,
    lastDueReminder,
    recentDueReminders,
  ] = await Promise.all([
    prisma.auditEvent.count({
      where: {
        companyId,
        action: "inspection.due_reminder_sent",
        createdAt: { gte: dueSince },
      },
    }),
    prisma.auditEvent.count({
      where: {
        companyId,
        action: "billing.trial_reminder_sent",
        createdAt: { gte: trialSince },
      },
    }),
    prisma.auditEvent.findFirst({
      where: { companyId, action: "automation.due_reminders_run" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, metadata: true },
    }),
    prisma.auditEvent.findFirst({
      where: { companyId, action: "automation.trial_reminders_run" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, metadata: true },
    }),
    prisma.auditEvent.findFirst({
      where: { companyId, action: "inspection.due_reminder_sent" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.auditEvent.findMany({
      where: { companyId, action: "inspection.due_reminder_sent" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        metadata: true,
      },
    }),
  ]);

  return {
    dueRemindersSentCount,
    trialRemindersSentCount,
    lastDueRemindersRunAt: lastDueRun?.createdAt ?? null,
    lastDueRemindersRunSent: metaNumber(lastDueRun?.metadata, "remindersSent"),
    lastTrialRemindersRunAt: lastTrialRun?.createdAt ?? null,
    lastTrialRemindersRunSent: metaNumber(lastTrialRun?.metadata, "remindersSent"),
    lastDueReminderSentAt: lastDueReminder?.createdAt ?? null,
    recentDueReminders: recentDueReminders.map((event) => ({
      id: event.id,
      createdAt: event.createdAt,
      buildingLabel: metaString(event.metadata, "buildingLabel"),
      inspectionTypeName: metaString(event.metadata, "inspectionTypeName"),
      dueAt: metaString(event.metadata, "dueAt"),
      sentTo: metaString(event.metadata, "sentTo") ?? firstRecipient(event.metadata),
    })),
    leadDays: DUE_REMINDER_DAYS,
  };
}

export function formatAutomationRunSummary(
  runAt: Date | null,
  sent: number | null,
): string {
  if (!runAt) return "No automated check recorded yet.";
  const when = formatDateTime(runAt);
  if (sent === null) return `Last checked ${when}.`;
  if (sent === 0) return `Last checked ${when} · 0 sent that run.`;
  return `Last checked ${when} · ${sent} sent that run.`;
}

export function formatRecentDueReminderLine(reminder: AutomationRecentReminder): string {
  const parts = [
    formatDate(reminder.createdAt),
    reminder.buildingLabel,
    reminder.inspectionTypeName ? `${reminder.inspectionTypeName} due` : null,
    reminder.dueAt ? formatDate(new Date(reminder.dueAt)) : null,
    reminder.sentTo ? `→ ${reminder.sentTo}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
