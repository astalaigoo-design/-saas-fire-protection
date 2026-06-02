import { getReportEmailFrom, isReportEmailConfigured } from "@/lib/email/env";
import { APP_NAME } from "@/lib/branding";
import {
  formatReinspectionScheduleDate,
  REINSPECTION_DAYS,
} from "@/lib/quotes/accept-quote-schedule";
import type { QuoteAcceptScheduleOutcome } from "@/lib/quotes/accept-quote-schedule";
import { getAppOrigin } from "@/lib/app-url";
import {
  dashboardReportsUrl,
  dashboardScheduleReinspectionFromQuoteUrl,
} from "@/lib/quotes/dashboard-quote-urls";
import { Resend } from "resend";

export type QuoteCustomerResponseKind = "accepted" | "declined" | "request_changes";

export type SendQuoteCustomerResponseEmailInput = {
  to: string;
  companyName: string;
  customerName: string;
  buildingLabel: string;
  quoteTitle: string;
  response: QuoteCustomerResponseKind;
  customerMessage?: string;
  replyTo?: string | null;
  quoteId?: string;
  schedule?: QuoteAcceptScheduleOutcome;
};

export type SendQuoteCustomerResponseEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function subjectFor(response: QuoteCustomerResponseKind, buildingLabel: string): string {
  switch (response) {
    case "accepted":
      return `Quote accepted — ${buildingLabel}`;
    case "declined":
      return `Quote declined — ${buildingLabel}`;
    case "request_changes":
      return `Quote change request — ${buildingLabel}`;
  }
}

function summaryFor(input: SendQuoteCustomerResponseEmailInput): string {
  switch (input.response) {
    case "accepted":
      return `<strong>${escapeHtml(input.customerName)}</strong> accepted the repair quote for <strong>${escapeHtml(input.buildingLabel)}</strong>.`;
    case "declined":
      return `<strong>${escapeHtml(input.customerName)}</strong> declined the repair quote for <strong>${escapeHtml(input.buildingLabel)}</strong>.`;
    case "request_changes":
      return `<strong>${escapeHtml(input.customerName)}</strong> requested changes to the repair quote for <strong>${escapeHtml(input.buildingLabel)}</strong>.`;
  }
}

function scheduleBlockForAccepted(input: SendQuoteCustomerResponseEmailInput): string {
  if (input.response !== "accepted" || !input.quoteId) return "";

  if (input.schedule?.scheduled) {
    const when = formatReinspectionScheduleDate(input.schedule.scheduledAt);
    const at = input.schedule.scheduledAt;
    const calendarUrl = `${getAppOrigin()}/dashboard/jobs?year=${at.getFullYear()}&month=${at.getMonth() + 1}&fromQuote=${encodeURIComponent(input.quoteId)}`;
    return `
      <p style="margin-top:16px;padding:12px;background:#ecfdf5;border-radius:8px;color:#065f46;">
        A <strong>re-inspection</strong> is on the calendar for <strong>${escapeHtml(when)}</strong>
        (${REINSPECTION_DAYS} days out).
      </p>
      <p style="margin-top:12px;">
        <a href="${escapeHtml(calendarUrl)}" style="display:inline-block;padding:10px 16px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Open calendar
        </a>
      </p>
    `;
  }

  const scheduleUrl = dashboardScheduleReinspectionFromQuoteUrl(input.quoteId);
  const reportsUrl = dashboardReportsUrl(input.quoteId);
  const reason =
    input.schedule && !input.schedule.scheduled
      ? `<p style="margin-top:8px;color:#64748b;font-size:14px;">${escapeHtml(input.schedule.reason)}</p>`
      : "";

  return `
    <p style="margin-top:16px;">Schedule the follow-up re-inspection (${REINSPECTION_DAYS} days out) in one click:</p>
    <p style="margin-top:12px;">
      <a href="${escapeHtml(scheduleUrl)}" style="display:inline-block;padding:10px 16px;background:#d97706;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        Schedule re-inspection
      </a>
    </p>
    ${reason}
    <p style="margin-top:12px;color:#64748b;font-size:14px;">
      Or open <a href="${escapeHtml(reportsUrl)}">${escapeHtml(APP_NAME)} → Reports</a>.
    </p>
  `;
}

function buildHtml(input: SendQuoteCustomerResponseEmailInput): string {
  const messageBlock =
    input.response === "request_changes" && input.customerMessage
      ? `<p style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:8px;white-space:pre-wrap;">${escapeHtml(input.customerMessage)}</p>`
      : "";

  const acceptedSchedule =
    input.response === "accepted" ? scheduleBlockForAccepted(input) : "";

  const footer =
    input.response === "accepted" && input.quoteId
      ? ""
      : `<p style="margin-top:16px;color:#64748b;font-size:14px;">Open ${escapeHtml(APP_NAME)} → Reports to review and follow up.</p>`;

  return `
    <p>Hello,</p>
    <p>${summaryFor(input)}</p>
    <p>Quote: <strong>${escapeHtml(input.quoteTitle)}</strong></p>
    ${messageBlock}
    ${acceptedSchedule}
    ${footer}
  `.trim();
}

export async function sendQuoteCustomerResponseEmail(
  input: SendQuoteCustomerResponseEmailInput,
): Promise<SendQuoteCustomerResponseEmailResult> {
  if (!isReportEmailConfigured()) {
    return {
      ok: false,
      error: "Email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM).",
    };
  }

  const from = getReportEmailFrom();
  if (!from) {
    return { ok: false, error: "REPORT_EMAIL_FROM is not set." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: subjectFor(input.response, input.buildingLabel),
    html: buildHtml(input),
    replyTo: input.replyTo?.trim() || undefined,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, messageId: data?.id ?? "unknown" };
}
