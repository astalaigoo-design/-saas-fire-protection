import { NextResponse } from "next/server";
import { cleanupExpiredIdempotencyKeys } from "@/lib/api/idempotency-cleanup";
import { captureRouteError } from "@/lib/monitoring/capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
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

