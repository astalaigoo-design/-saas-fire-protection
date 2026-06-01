import { getReportEmailFrom, isReportEmailConfigured } from "@/lib/email/env";
import { APP_NAME } from "@/lib/branding";
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

function buildHtml(input: SendQuoteCustomerResponseEmailInput): string {
  const messageBlock =
    input.response === "request_changes" && input.customerMessage
      ? `<p style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:8px;white-space:pre-wrap;">${escapeHtml(input.customerMessage)}</p>`
      : "";

  return `
    <p>Hello,</p>
    <p>${summaryFor(input)}</p>
    <p>Quote: <strong>${escapeHtml(input.quoteTitle)}</strong></p>
    ${messageBlock}
    <p style="margin-top:16px;color:#64748b;font-size:14px;">Open ${escapeHtml(APP_NAME)} → Reports to review and follow up.</p>
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
