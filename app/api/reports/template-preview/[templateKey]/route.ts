import { NextResponse } from "next/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { generateReportTemplatePreview } from "@/lib/reports/generate-template-preview";
import { captureRouteError } from "@/lib/monitoring/capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: { templateKey: string };
};

function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to preview templates." }, { status: 401 });
  }

  try {
    const result = await generateReportTemplatePreview(context.params.templateKey);
    if (!result) {
      return NextResponse.json({ error: "Unknown template." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(result.filename),
        "Content-Length": String(result.buffer.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    captureRouteError("GET /api/reports/template-preview/[templateKey]", error);
    const message = error instanceof Error ? error.message : "Could not generate preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
