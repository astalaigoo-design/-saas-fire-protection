import { formatDate } from "@/lib/dashboard/dates";
import { getReportEmailFrom, isReportEmailConfigured } from "@/lib/email/env";
import { Resend } from "resend";

export type SendDueReminderEmailInput = {
  to: string[];
  companyName: string;
  buildingLabel: string;
  customerName: string;
  inspectionTypeName: string;
  dueAt: Date;
  replyTo?: string | null;
};

export type SendDueReminderEmailResult =
  | { ok: true; messageIds: string[] }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSubject(input: SendDueReminderEmailInput): string {
  return `Inspection due in 7 days — ${input.buildingLabel}`;
}

function buildHtml(input: SendDueReminderEmailInput): string {
  return `
    <p>Hello,</p>
    <p><strong>${escapeHtml(input.buildingLabel)}</strong> (${escapeHtml(input.customerName)}) has a
    <strong>${escapeHtml(input.inspectionTypeName)}</strong> inspection due on
    <strong>${escapeHtml(formatDate(input.dueAt))}</strong>.</p>
    <p>Schedule the visit in GetFlareflow before the due date to stay compliant.</p>
    <p style="color:#64748b;font-size:14px;">Sent automatically by ${escapeHtml(input.companyName)}.</p>
  `.trim();
}

export async function sendDueReminderEmail(
  input: SendDueReminderEmailInput,
): Promise<SendDueReminderEmailResult> {
  if (!isReportEmailConfigured()) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM)." };
  }

  const recipients = input.to.map((email) => email.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, error: "No reminder recipients configured." };
  }

  const from = getReportEmailFrom();
  if (!from) {
    return { ok: false, error: "REPORT_EMAIL_FROM is missing." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const messageIds: string[] = [];

  for (const to of recipients) {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: input.replyTo?.trim() || undefined,
      subject: buildSubject(input),
      html: buildHtml(input),
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (data?.id) messageIds.push(data.id);
  }

  return { ok: true, messageIds };
}
