import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { generatePublicQuotePdf } from "@/lib/quotes/generate-quote-pdf";
import { getPublicQuoteMeta } from "@/lib/quotes/public-quote";

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
  const meta = await getPublicQuoteMeta(context.params.token);
  if (!meta) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  try {
    const { buffer, filename } = await generatePublicQuotePdf(context.params.token);
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
    captureRouteError("GET /api/public/quotes/[token]", error);
    return NextResponse.json({ error: "Could not generate quote." }, { status: 500 });
  }
}
