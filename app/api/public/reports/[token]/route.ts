import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { renderComplianceReportPdf } from "@/lib/reports/generate-compliance-report";
import { getPublicReportMeta, getPublicReportPdfData } from "@/lib/reports/public-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: { token: string };
};

function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const meta = await getPublicReportMeta(context.params.token);
  if (!meta) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  try {
    const data = await getPublicReportPdfData(context.params.token);
    if (!data) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const buffer = await renderComplianceReportPdf(data);
    const slug = meta.customerName.replace(/[^\w-]+/g, "-").toLowerCase();
    const date = meta.completedAt.toISOString().slice(0, 10);
    const filename = `compliance-${slug}-${date}.pdf`;

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
    captureRouteError("GET /api/public/reports/[token]", error);
    return NextResponse.json({ error: "Could not generate report." }, { status: 500 });
  }
}
