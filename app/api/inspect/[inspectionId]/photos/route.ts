import { NextResponse } from "next/server";
import {
  getCachedIdempotentResponse,
  getIdempotencyCacheKey,
  setCachedIdempotentResponse,
} from "@/lib/api/idempotency";
import { uploadInspectionPhoto } from "@/lib/inspect/actions";

type PhotoRouteProps = {
  params: { inspectionId: string };
};

export async function POST(request: Request, { params }: PhotoRouteProps) {
  const idempotencyKey = request.headers.get("x-idempotency-key");
  const cacheKey = idempotencyKey
    ? getIdempotencyCacheKey(`inspect-photo-upload:${params.inspectionId}`, idempotencyKey)
    : null;
  if (cacheKey) {
    const cached = getCachedIdempotentResponse(cacheKey);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  let payload: { dataUrl?: unknown; caption?: unknown } = {};
  try {
    payload = (await request.json()) as { dataUrl?: unknown; caption?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const result = await uploadInspectionPhoto({
    inspectionId: params.inspectionId,
    dataUrl: payload.dataUrl,
    caption: payload.caption,
  });

  const status = result.ok ? 200 : 400;
  if (cacheKey) {
    setCachedIdempotentResponse(cacheKey, { status, body: result });
  }
  return NextResponse.json(result, { status });
}
