import { NextResponse } from "next/server";
import {
  getIdempotencyCacheKey,
  lookupIdempotentResponse,
  requestJsonHash,
  setCachedIdempotentResponse,
} from "@/lib/api/idempotency";
import {
  authenticateApiRequest,
  isApiAuthContext,
} from "@/lib/integrations/authenticate";

export async function withApiAuthPost<TBody>(
  request: Request,
  scope: string,
  handler: (
    ctx: { companyId: string; apiKeyId: string },
    body: TBody,
  ) => Promise<NextResponse>,
  parseBody: (raw: unknown) => { ok: true; data: TBody } | { ok: false; error: string },
): Promise<NextResponse> {
  const auth = await authenticateApiRequest(request);
  if (!isApiAuthContext(auth)) return auth;

  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim();
  const requestHash = await requestJsonHash(request);
  const path = new URL(request.url).pathname;

  if (idempotencyKey) {
    const cacheKey = getIdempotencyCacheKey(`${scope}:${auth.companyId}`, idempotencyKey);
    const lookup = await lookupIdempotentResponse({
      cacheKey,
      requestHash,
      method: "POST",
      path,
    });
    if (lookup.kind === "conflict") {
      return NextResponse.json(
        { error: "Idempotency key was already used with a different request body." },
        { status: 409 },
      );
    }
    if (lookup.kind === "hit") {
      return NextResponse.json(lookup.response.body, { status: lookup.response.status });
    }
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = parseBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const response = await handler(auth, parsed.data);

  if (idempotencyKey && response.status >= 200 && response.status < 300) {
    const cacheKey = getIdempotencyCacheKey(`${scope}:${auth.companyId}`, idempotencyKey);
    try {
      const body = await response.clone().json();
      await setCachedIdempotentResponse({
        cacheKey,
        requestHash,
        method: "POST",
        path,
        response: { status: response.status, body },
      });
    } catch {
      /* skip cache if body is not JSON */
    }
  }

  return response;
}

export function v1Created(data: unknown): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function v1WriteError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}
