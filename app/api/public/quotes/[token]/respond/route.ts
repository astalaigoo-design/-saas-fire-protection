import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import {
  publicQuoteResponseSchema,
  respondToPublicQuote,
} from "@/lib/quotes/public-quote-respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: { token: string };
};

export async function POST(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = publicQuoteResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const result = await respondToPublicQuote(context.params.token, parsed.data);
    const status = result.ok ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    captureRouteError("POST /api/public/quotes/[token]/respond", error);
    return NextResponse.json({ ok: false, error: "Could not save your response." }, { status: 500 });
  }
}
