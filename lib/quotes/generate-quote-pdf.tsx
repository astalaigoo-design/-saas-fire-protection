import { renderToBuffer } from "@react-pdf/renderer";
import type { DashboardSession } from "@/lib/dashboard/session";
import { QuotePdfDocument } from "@/lib/quotes/quote-pdf-document";
import { getQuotePdfData } from "@/lib/quotes/queries";

export async function renderQuotePdf(data: Awaited<ReturnType<typeof getQuotePdfData>>): Promise<Buffer> {
  if (!data) throw new Error("Quote not found.");
  const buffer = await renderToBuffer(<QuotePdfDocument data={data} />);
  return Buffer.from(buffer);
}

function buildFilename(data: NonNullable<Awaited<ReturnType<typeof getQuotePdfData>>>): string {
  const slug = data.customerName.replace(/[^\w-]+/g, "-").toLowerCase();
  const date = data.createdAt.toISOString().slice(0, 10);
  return `repair-quote-${slug}-${date}.pdf`;
}

export async function generateQuotePdf(
  session: DashboardSession,
  quoteId: string,
): Promise<{ buffer: Buffer; filename: string; data: NonNullable<Awaited<ReturnType<typeof getQuotePdfData>>> }> {
  const data = await getQuotePdfData(session, quoteId);
  if (!data) {
    throw new Error("Quote not found or you do not have access.");
  }
  const buffer = await renderQuotePdf(data);
  return { buffer, filename: buildFilename(data), data };
}
