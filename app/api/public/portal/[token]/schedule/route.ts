import { NextResponse } from "next/server";
import {
  portalScheduleRequestSchema,
  scheduleInspectionFromPortal,
} from "@/lib/customers/portal-schedule";
import { captureRouteError } from "@/lib/monitoring/capture";

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

  const parsed = portalScheduleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const result = await scheduleInspectionFromPortal(context.params.token, parsed.data);
    const status = result.ok ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    captureRouteError("POST /api/public/portal/[token]/schedule", error);
    return NextResponse.json(
      { ok: false, error: "Could not schedule the inspection." },
      { status: 500 },
    );
  }
}
