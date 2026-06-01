import { Resend } from "resend";
import { getReportEmailFrom, isReportEmailConfigured } from "@/lib/email/env";

type QuoteEmailLineItem = {
  label: string;
  description: string | null;
  quantity: number;
  unitPriceCents: number;
};

export type SendQuoteEmailInput = {
  to: string;
  customerName: string;
  companyName: string;
  buildingLabel: string;
  inspectionTypeName: string;
  quoteTitle: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  lineItems: QuoteEmailLineItem[];
  replyTo?: string | null;
  quoteLink?: string | null;
  reportLink?: string | null;
  quotePdfBuffer?: Buffer;
  quotePdfFilename?: string;
  reportPdfBuffer?: Buffer;
  reportPdfFilename?: string;
};

export type SendQuoteEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(input: SendQuoteEmailInput): string {
  const rows = input.lineItems
    .map((item) => {
      const lineTotal = item.quantity * item.unitPriceCents;
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.label)}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatCurrency(item.unitPriceCents, input.currency))}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatCurrency(lineTotal, input.currency))}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <p>Hello ${escapeHtml(input.customerName)},</p>
    <p>Please find your fire inspection report and repair quote for <strong>${escapeHtml(input.buildingLabel)}</strong> (${escapeHtml(input.inspectionTypeName)}).</p>
    <p><strong>${escapeHtml(input.quoteTitle)}</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr>
          <th style="padding:8px;border-bottom:2px solid #cbd5e1;text-align:left;">Item</th>
          <th style="padding:8px;border-bottom:2px solid #cbd5e1;text-align:right;">Qty</th>
          <th style="padding:8px;border-bottom:2px solid #cbd5e1;text-align:right;">Unit price</th>
          <th style="padding:8px;border-bottom:2px solid #cbd5e1;text-align:right;">Line total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:0;">Subtotal: ${escapeHtml(formatCurrency(input.subtotalCents, input.currency))}</p>
    <p style="margin:0;">Tax: ${escapeHtml(formatCurrency(input.taxCents, input.currency))}</p>
    <p style="margin:0;">Discount: -${escapeHtml(formatCurrency(input.discountCents, input.currency))}</p>
    <p style="margin-top:8px;"><strong>Total: ${escapeHtml(formatCurrency(input.totalCents, input.currency))}</strong></p>
    <ul style="margin:12px 0;padding-left:1.25rem;color:#0f172a;">
      ${
        input.reportPdfBuffer
          ? "<li>Compliance inspection report (PDF attached)</li>"
          : ""
      }
      <li>Repair quote (PDF attached)</li>
    </ul>
    ${
      input.reportLink || input.quoteLink
        ? `<p style="margin-top:12px;">${
            input.reportLink
              ? `<a href="${escapeHtml(input.reportLink)}" style="color:#b45309;font-weight:600;">View inspection report online</a>`
              : ""
          }${
            input.reportLink && input.quoteLink
              ? ` &nbsp;·&nbsp; `
              : ""
          }${
            input.quoteLink
              ? `<a href="${escapeHtml(input.quoteLink)}" style="color:#b45309;font-weight:600;">View quote online</a>`
              : ""
          } (no login required).</p>`
        : ""
    }
    <p style="color:#64748b;font-size:14px;">Reply to this email with questions. Sent by ${escapeHtml(input.companyName)}.</p>
  `.trim();
}

export async function sendQuoteEmail(
  input: SendQuoteEmailInput,
): Promise<SendQuoteEmailResult> {
  if (!isReportEmailConfigured()) {
    return { ok: false, error: "Quote email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM)." };
  }

  const from = getReportEmailFrom();
  if (!from) return { ok: false, error: "REPORT_EMAIL_FROM is missing." };

  const resend = new Resend(process.env.RESEND_API_KEY);

  const attachments: { filename: string; content: Buffer }[] = [];
  if (input.reportPdfBuffer && input.reportPdfFilename) {
    attachments.push({
      filename: input.reportPdfFilename,
      content: input.reportPdfBuffer,
    });
  }
  if (input.quotePdfBuffer && input.quotePdfFilename) {
    attachments.push({
      filename: input.quotePdfFilename,
      content: input.quotePdfBuffer,
    });
  }

  const subject = input.reportPdfBuffer
    ? `Inspection report & repair quote — ${input.buildingLabel}`
    : `Repair quote — ${input.buildingLabel}`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [input.to],
      replyTo: input.replyTo?.trim() || undefined,
      subject,
      html: buildHtml(input),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) return { ok: false, error: error.message };
    if (!data?.id) return { ok: false, error: "Email provider did not return a message id." };
    return { ok: true, messageId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return { ok: false, error: message };
  }
}
