import { NextResponse } from "next/server";
import {
  getIdempotencyCacheKey,
  lookupIdempotentResponse,
  requestJsonHash,
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
  const requestHash = cacheKey ? await requestJsonHash(request) : null;
  if (cacheKey) {
    const lookup = await lookupIdempotentResponse({
      cacheKey,
      requestHash,
      method: "DELETE",
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

  const result = await deleteInspectionPhoto(params.inspectionId, params.photoId);
  const status = result.ok ? 200 : 400;
  if (cacheKey) {
    await setCachedIdempotentResponse({
      cacheKey,
      requestHash,
      method: "DELETE",
      path: new URL(request.url).pathname,
      response: { status, body: result },
    });
  }
  return NextResponse.json(result, { status });
}
