import { Resend } from "resend";
import { APP_NAME, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import { getReportEmailFrom, isOutboundEmailConfigured } from "@/lib/email/env";
import type { DesignPartnerApplicationInput } from "@/lib/marketing/design-partner-schema";

export type SendDesignPartnerApplicationResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(input: DesignPartnerApplicationInput): string {
  const rows = [
    ["Company", input.companyName],
    ["Contact", input.contactName],
    ["Email", input.email],
    ["Phone", input.phone ?? "—"],
    ["Team size", input.teamSize ?? "—"],
    ["Message", input.message ?? "—"],
  ];

  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;font-weight:600;">${escapeHtml(label)}</td><td style="padding:4px 0;">${escapeHtml(value).replace(/\n/g, "<br/>")}</td></tr>`,
    )
    .join("");

  return `
    <p>New ${escapeHtml(APP_NAME)} design partner application:</p>
    <table style="border-collapse:collapse;font-size:14px;line-height:1.5;">${body}</table>
    <p style="color:#64748b;font-size:14px;margin-top:16px;">Reply directly to the applicant using Reply in your mail client.</p>
  `.trim();
}

export async function sendDesignPartnerApplicationEmail(
  input: DesignPartnerApplicationInput,
): Promise<SendDesignPartnerApplicationResult> {
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

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from,
    to: [PILOT_SUPPORT_EMAIL],
    replyTo: input.email,
    subject: `Design partner application — ${input.companyName}`,
    html: buildHtml(input),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: "Email provider returned no message id." };
  }

  return { ok: true, messageId: data.id };
}
