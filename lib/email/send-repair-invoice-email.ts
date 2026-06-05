import { Resend } from "resend";
import { getReportEmailFrom, isOutboundEmailConfigured } from "@/lib/email/env";

type RepairInvoiceEmailLineItem = {
  label: string;
  description: string | null;
  quantity: number;
  unitPriceCents: number;
};

export type SendRepairInvoiceEmailInput = {
  to: string;
  customerName: string;
  companyName: string;
  buildingLabel: string;
  invoiceNumber: string;
  quoteTitle: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  dueAt: Date | null;
  lineItems: RepairInvoiceEmailLineItem[];
  replyTo?: string | null;
  invoicePdfBuffer?: Buffer;
  invoicePdfFilename?: string;
};

export type SendRepairInvoiceEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatDueDate(dueAt: Date | null): string | null {
  if (!dueAt) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dueAt);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(input: SendRepairInvoiceEmailInput): string {
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

  const dueLabel = formatDueDate(input.dueAt);

  return `
    <p>Hello ${escapeHtml(input.customerName)},</p>
    <p>Please find invoice <strong>${escapeHtml(input.invoiceNumber)}</strong> for repair work at <strong>${escapeHtml(input.buildingLabel)}</strong>.</p>
    <p><strong>${escapeHtml(input.quoteTitle)}</strong></p>
    ${dueLabel ? `<p>Payment due: <strong>${escapeHtml(dueLabel)}</strong></p>` : ""}
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
    <p style="margin-top:8px;"><strong>Amount due: ${escapeHtml(formatCurrency(input.totalCents, input.currency))}</strong></p>
    <p style="margin-top:12px;">Repair invoice PDF attached.</p>
    <p style="color:#64748b;font-size:14px;">Reply to this email with questions. Sent by ${escapeHtml(input.companyName)}.</p>
  `.trim();
}

export async function sendRepairInvoiceEmail(
  input: SendRepairInvoiceEmailInput,
): Promise<SendRepairInvoiceEmailResult> {
  if (!isOutboundEmailConfigured()) {
    return {
      ok: false,
      error: "Outbound email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM).",
    };
  }

  const from = getReportEmailFrom();
  if (!from) return { ok: false, error: "REPORT_EMAIL_FROM is missing." };

  const resend = new Resend(process.env.RESEND_API_KEY);

  const attachments: { filename: string; content: Buffer }[] = [];
  if (input.invoicePdfBuffer && input.invoicePdfFilename) {
    attachments.push({
      filename: input.invoicePdfFilename,
      content: input.invoicePdfBuffer,
    });
  }

  const subject = `Repair invoice ${input.invoiceNumber} — ${input.buildingLabel}`;

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
