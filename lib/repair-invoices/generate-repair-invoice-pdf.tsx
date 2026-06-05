import { renderToBuffer } from "@react-pdf/renderer";
import type { DashboardSession } from "@/lib/dashboard/session";
import { getRepairInvoicePdfData, type RepairInvoicePdfData } from "@/lib/repair-invoices/queries";
import { RepairInvoicePdfDocument } from "@/lib/repair-invoices/repair-invoice-pdf-document";
import { sanitizeCompanyLogoForPdf } from "@/lib/reports/pdf-images";

function prepareRepairInvoicePdfData(data: RepairInvoicePdfData): RepairInvoicePdfData {
  return {
    ...data,
    logoUrl: sanitizeCompanyLogoForPdf(data.logoUrl),
  };
}

export async function renderRepairInvoicePdf(
  data: RepairInvoicePdfData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <RepairInvoicePdfDocument data={prepareRepairInvoicePdfData(data)} />,
  );
  return Buffer.from(buffer);
}

function buildFilename(data: RepairInvoicePdfData): string {
  const slug = data.customerName.replace(/[^\w-]+/g, "-").toLowerCase();
  const date = data.issuedAt.toISOString().slice(0, 10);
  return `repair-invoice-${data.invoiceNumber}-${slug}-${date}.pdf`;
}

export async function generateRepairInvoicePdf(
  session: DashboardSession,
  invoiceId: string,
): Promise<{ buffer: Buffer; filename: string; data: RepairInvoicePdfData }> {
  const data = await getRepairInvoicePdfData(session, invoiceId);
  if (!data) {
    throw new Error("Invoice not found or you do not have access.");
  }
  const buffer = await renderRepairInvoicePdf(data);
  return { buffer, filename: buildFilename(data), data };
}
