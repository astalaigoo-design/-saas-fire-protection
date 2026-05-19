import { NextResponse } from "next/server";
import {
  getCachedIdempotentResponse,
  getIdempotencyCacheKey,
  setCachedIdempotentResponse,
} from "@/lib/api/idempotency";
import { deleteInspectionPhoto } from "@/lib/inspect/actions";

type DeletePhotoRouteProps = {
  params: { inspectionId: string; photoId: string };
};

export async function DELETE(request: Request, { params }: DeletePhotoRouteProps) {
  const idempotencyKey = request.headers.get("x-idempotency-key");
  const cacheKey = idempotencyKey
    ? getIdempotencyCacheKey(
        `inspect-photo-delete:${params.inspectionId}:${params.photoId}`,
        idempotencyKey,
      )
    : null;
  if (cacheKey) {
    const cached = getCachedIdempotentResponse(cacheKey);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  const result = await deleteInspectionPhoto(params.inspectionId, params.photoId);
  const status = result.ok ? 200 : 400;
  if (cacheKey) {
    setCachedIdempotentResponse(cacheKey, { status, body: result });
  }
  return NextResponse.json(result, { status });
}
