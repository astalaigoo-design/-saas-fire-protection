import { formatDate } from "@/lib/dashboard/dates";
import { getReportEmailFrom, isReportEmailConfigured } from "@/lib/email/env";
import { APP_NAME } from "@/lib/branding";
import { Resend } from "resend";

export type SendTrialEndingEmailInput = {
  to: string[];
  companyName: string;
  trialEndsAt: Date;
  daysBefore: 7 | 1;
  billingUrl: string;
  replyTo?: string | null;
};

export type SendTrialEndingEmailResult =
  | { ok: true; messageIds: string[] }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSubject(daysBefore: 7 | 1): string {
  if (daysBefore === 1) {
    return `Your ${APP_NAME} trial ends tomorrow`;
  }
  return `Your ${APP_NAME} trial ends in 7 days`;
}

function buildHtml(input: SendTrialEndingEmailInput): string {
  const endsLabel = formatDate(input.trialEndsAt);
  const urgency =
    input.daysBefore === 1
      ? "Your free trial ends <strong>tomorrow</strong>."
      : "Your free trial ends in <strong>7 days</strong>.";

  return `
    <p>Hello,</p>
    <p>${urgency}</p>
    <p>Trial end date for <strong>${escapeHtml(input.companyName)}</strong>: ${escapeHtml(endsLabel)}.</p>
    <p>Subscribe now to keep using ${escapeHtml(APP_NAME)} without interruption — inspections, reports, and quotes for your team.</p>
    <p style="margin-top:16px;">
      <a href="${escapeHtml(input.billingUrl)}" style="color:#b45309;font-weight:600;">Open billing &amp; subscribe</a>
    </p>
    <p style="color:#64748b;font-size:14px;">Questions? Reply to this email.</p>
  `.trim();
}

export async function sendTrialEndingEmail(
  input: SendTrialEndingEmailInput,
): Promise<SendTrialEndingEmailResult> {
  if (!isReportEmailConfigured()) {
    return {
      ok: false,
      error: "Email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM).",
    };
  }

  const recipients = input.to.map((email) => email.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, error: "No owner email addresses found." };
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
      subject: buildSubject(input.daysBefore),
      html: buildHtml(input),
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (data?.id) messageIds.push(data.id);
  }

  return { ok: true, messageIds };
}
