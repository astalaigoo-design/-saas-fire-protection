import { NextResponse } from "next/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureRouteError } from "@/lib/monitoring/capture";
import { generateRepairInvoicePdf } from "@/lib/repair-invoices/generate-repair-invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: { invoiceId: string };
};

function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to preview this invoice." }, { status: 401 });
  }

  try {
    const { buffer, filename } = await generateRepairInvoicePdf(session, context.params.invoiceId);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(filename),
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    captureRouteError("GET /api/repair-invoices/[invoiceId]/pdf", error);
    const message = error instanceof Error ? error.message : "Could not generate invoice PDF.";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
