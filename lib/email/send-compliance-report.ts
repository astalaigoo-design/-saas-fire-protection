import { Resend } from "resend";
import { formatDate } from "@/lib/dashboard/dates";
import { getReportEmailFrom, isOutboundEmailConfigured } from "@/lib/email/env";

export type SendComplianceReportEmailInput = {
  to: string;
  customerName: string;
  buildingLabel: string;
  companyName: string;
  inspectionTypeName: string;
  completedAt: Date;
  overallPass: boolean;
  pdfBuffer: Buffer;
  filename: string;
  replyTo?: string | null;
  /** Customer-facing read-only link (included in email body). */
  reportLink?: string | null;
};

export type SendComplianceReportEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function buildSubject(input: SendComplianceReportEmailInput): string {
  const outcome = input.overallPass ? "Passed" : "Needs attention";
  return `Fire inspection report — ${input.buildingLabel} (${outcome})`;
}

function buildHtml(input: SendComplianceReportEmailInput): string {
  const completed = formatDate(input.completedAt);
  const outcome = input.overallPass
    ? "The inspection passed overall."
    : "Some items need attention — see the attached PDF for details.";

  return `
    <p>Hello,</p>
    <p>Your fire inspection for <strong>${escapeHtml(input.buildingLabel)}</strong> was completed on ${escapeHtml(completed)}.</p>
    <p>${outcome}</p>
    <p>Inspection type: ${escapeHtml(input.inspectionTypeName)}<br />
    Customer: ${escapeHtml(input.customerName)}<br />
    Prepared by: ${escapeHtml(input.companyName)}</p>
    <p>The full compliance report is attached as a PDF.</p>
    ${
      input.reportLink
        ? `<p>You can also view the report online: <a href="${escapeHtml(input.reportLink)}">${escapeHtml(input.reportLink)}</a></p>`
        : ""
    }
    <p style="color:#64748b;font-size:14px;">This message was sent automatically after your technician submitted the inspection.</p>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendComplianceReportEmail(
  input: SendComplianceReportEmailInput,
): Promise<SendComplianceReportEmailResult> {
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

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [input.to],
      replyTo: input.replyTo?.trim() || undefined,
      subject: buildSubject(input),
      html: buildHtml(input),
      attachments: [
        {
          filename: input.filename,
          content: input.pdfBuffer,
        },
      ],
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
