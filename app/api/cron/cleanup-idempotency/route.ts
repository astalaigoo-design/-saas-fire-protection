import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/authorize";
import { cleanupExpiredIdempotencyKeys } from "@/lib/api/idempotency-cleanup";
import { captureRouteError } from "@/lib/monitoring/capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredIdempotencyKeys();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    captureRouteError("GET /api/cron/cleanup-idempotency", error);
    return NextResponse.json({ error: "Internal cron error" }, { status: 500 });
  }
}

