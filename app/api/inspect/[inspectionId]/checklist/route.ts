import { NextResponse } from "next/server";
import {
  getCachedIdempotentResponse,
  getIdempotencyCacheKey,
  setCachedIdempotentResponse,
} from "@/lib/api/idempotency";
import { updateChecklistItem } from "@/lib/inspect/actions";

type ChecklistRouteProps = {
  params: { inspectionId: string };
};

export async function POST(request: Request, { params }: ChecklistRouteProps) {
  const idempotencyKey = request.headers.get("x-idempotency-key");
  const cacheKey = idempotencyKey
    ? getIdempotencyCacheKey(`inspect-checklist:${params.inspectionId}`, idempotencyKey)
    : null;
  if (cacheKey) {
    const cached = getCachedIdempotentResponse(cacheKey);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  let payload: { itemId?: unknown; result?: unknown; notes?: unknown } = {};
  try {
    payload = (await request.json()) as { itemId?: unknown; result?: unknown; notes?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const result = await updateChecklistItem({
    inspectionId: params.inspectionId,
    itemId: payload.itemId,
    result: payload.result,
    notes: payload.notes,
  });

  const status = result.ok ? 200 : 400;
  if (cacheKey) {
    setCachedIdempotentResponse(cacheKey, { status, body: result });
  }
  return NextResponse.json(result, { status });
}
