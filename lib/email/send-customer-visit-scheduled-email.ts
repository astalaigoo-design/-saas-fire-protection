import { Resend } from "resend";
import { getReportEmailFrom, isOutboundEmailConfigured } from "@/lib/email/env";

export type SendCustomerVisitScheduledEmailInput = {
  to: string;
  customerName: string;
  companyName: string;
  buildingLabel: string;
  inspectionTypeName: string;
  scheduledAt: Date;
  replyTo?: string | null;
  portalLink?: string | null;
};

export type SendCustomerVisitScheduledEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function sendCustomerVisitScheduledEmail(
  input: SendCustomerVisitScheduledEmailInput,
): Promise<SendCustomerVisitScheduledEmailResult> {
  if (!isOutboundEmailConfigured()) {
    return {
      ok: false,
      error: "Outbound email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM).",
    };
  }

  const from = getReportEmailFrom();
  if (!from) {
    return { ok: false, error: "REPORT_EMAIL_FROM is missing." };
  }

  const when = formatWhen(input.scheduledAt);
  const portalBlock = input.portalLink
    ? `<p>View your sites, reports, and schedule in your customer portal (no login): <a href="${escapeHtml(input.portalLink)}">${escapeHtml(input.portalLink)}</a></p>`
    : "";

  const html = `
    <p>Hello${input.customerName ? ` ${escapeHtml(input.customerName)}` : ""},</p>
    <p><strong>${escapeHtml(input.companyName)}</strong> scheduled a fire protection visit:</p>
    <p><strong>${escapeHtml(input.inspectionTypeName)}</strong><br />
    ${escapeHtml(input.buildingLabel)}<br />
    ${escapeHtml(when)}</p>
    ${portalBlock}
    <p style="color:#64748b;font-size:14px;">Reply to this email with questions about your visit.</p>
  `.trim();

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [input.to],
      replyTo: input.replyTo?.trim() || undefined,
      subject: `Visit scheduled — ${input.buildingLabel}`,
      html,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.id) {
      return { ok: false, error: "Email provider did not return a message id." };
    }

    return { ok: true, messageId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return { ok: false, error: message };
  }
}
