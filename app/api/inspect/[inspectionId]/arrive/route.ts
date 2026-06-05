import { NextResponse } from "next/server";
import {
  getIdempotencyCacheKey,
  lookupIdempotentResponse,
  requestJsonHash,
  setCachedIdempotentResponse,
} from "@/lib/api/idempotency";
import { recordVisitArrival } from "@/lib/inspect/actions";

type ArriveRouteProps = {
  params: { inspectionId: string };
};

export async function POST(request: Request, { params }: ArriveRouteProps) {
  const idempotencyKey = request.headers.get("x-idempotency-key");
  const cacheKey = idempotencyKey
    ? getIdempotencyCacheKey(`inspect-arrive:${params.inspectionId}`, idempotencyKey)
    : null;
  const requestHash = cacheKey ? await requestJsonHash(request) : null;
  if (cacheKey) {
    const lookup = await lookupIdempotentResponse({
      cacheKey,
      requestHash,
      method: "POST",
      path: new URL(request.url).pathname,
    });
    if (lookup.kind === "hit") {
      return NextResponse.json(lookup.response.body, { status: lookup.response.status });
    }
    if (lookup.kind === "conflict") {
      return NextResponse.json(
        { ok: false, error: "Idempotency key reuse with different request payload." },
        { status: 409 },
      );
    }
  }

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const result = await recordVisitArrival({
    inspectionId: params.inspectionId,
    ...(typeof payload === "object" && payload !== null ? payload : {}),
  });

  const status = result.ok ? 200 : 400;
  if (cacheKey) {
    await setCachedIdempotentResponse({
      cacheKey,
      requestHash,
      method: "POST",
      path: new URL(request.url).pathname,
      response: { status, body: result },
    });
  }
  return NextResponse.json(result, { status });
}
