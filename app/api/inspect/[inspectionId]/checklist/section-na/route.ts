import { NextResponse } from "next/server";
import {
  getCachedIdempotentResponse,
  getIdempotencyCacheKey,
  setCachedIdempotentResponse,
} from "@/lib/api/idempotency";
import { bulkMarkChecklistSectionNa } from "@/lib/inspect/actions";

type SectionNaRouteProps = {
  params: { inspectionId: string };
};

export async function POST(request: Request, { params }: SectionNaRouteProps) {
  const idempotencyKey = request.headers.get("x-idempotency-key");
  const cacheKey = idempotencyKey
    ? getIdempotencyCacheKey(
        `inspect-section-na:${params.inspectionId}`,
        idempotencyKey,
      )
    : null;
  if (cacheKey) {
    const cached = getCachedIdempotentResponse(cacheKey);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  let payload: { sectionKey?: unknown } = {};
  try {
    payload = (await request.json()) as { sectionKey?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const result = await bulkMarkChecklistSectionNa({
    inspectionId: params.inspectionId,
    sectionKey: payload.sectionKey,
  });

  const status = result.ok ? 200 : 400;
  if (cacheKey) {
    setCachedIdempotentResponse(cacheKey, { status, body: result });
  }
  return NextResponse.json(result, { status });
}
