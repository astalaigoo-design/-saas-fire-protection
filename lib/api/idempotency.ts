import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

export type CachedResponse = {
  status: number;
  body: unknown;
};

export type IdempotencyLookup =
  | { kind: "miss" }
  | { kind: "hit"; response: CachedResponse }
  | { kind: "conflict"; reason: "hash_mismatch" };

const TTL_MS = 10 * 60 * 1000;

type FallbackCached = CachedResponse & { expiresAt: number; requestHash?: string | null };

const globalStore = globalThis as unknown as {
  __idempotencyResponses?: Map<string, FallbackCached>;
};

function getFallbackStore(): Map<string, FallbackCached> {
  if (!globalStore.__idempotencyResponses) {
    globalStore.__idempotencyResponses = new Map<string, FallbackCached>();
  }
  return globalStore.__idempotencyResponses;
}

function getFallback(cacheKey: string, requestHash?: string | null): CachedResponse | null {
  const store = getFallbackStore();
  const cached = store.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    store.delete(cacheKey);
    return null;
  }
  if (requestHash && cached.requestHash && cached.requestHash !== requestHash) return null;
  return { status: cached.status, body: cached.body };
}

function setFallback(options: {
  cacheKey: string;
  requestHash?: string | null;
  response: CachedResponse;
}) {
  const store = getFallbackStore();
  store.set(options.cacheKey, {
    ...options.response,
    expiresAt: Date.now() + TTL_MS,
    requestHash: options.requestHash ?? null,
  });
}

export function getIdempotencyCacheKey(scope: string, key: string): string {
  return `${scope}:${key}`;
}

function sha256Base64Url(input: string): string {
  return createHash("sha256")
    .update(input)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function getCachedIdempotentResponse(
  cacheKey: string,
  requestHash?: string | null,
): Promise<CachedResponse | null> {
  try {
    const row = await prisma.idempotencyKey.findUnique({
      where: { cacheKey },
      select: { status: true, body: true, expiresAt: true, requestHash: true },
    });
    if (!row) return null;

    if (row.expiresAt.getTime() <= Date.now()) {
      // Best-effort cleanup; don't block response on failure.
      void prisma.idempotencyKey.delete({ where: { cacheKey } }).catch(() => {});
      return null;
    }

    if (requestHash && row.requestHash && row.requestHash !== requestHash) {
      // Key reuse with different payload — treat as cache miss so handler can reject.
      return null;
    }

    return { status: row.status, body: row.body };
  } catch {
    return getFallback(cacheKey, requestHash);
  }
}

export async function lookupIdempotentResponse(options: {
  cacheKey: string;
  requestHash?: string | null;
  method?: string | null;
  path?: string | null;
}): Promise<IdempotencyLookup> {
  try {
    const row = await prisma.idempotencyKey.findUnique({
      where: { cacheKey: options.cacheKey },
      select: {
        status: true,
        body: true,
        expiresAt: true,
        requestHash: true,
        method: true,
        path: true,
      },
    });
    if (!row) return { kind: "miss" };

    if (row.expiresAt.getTime() <= Date.now()) {
      void prisma.idempotencyKey.delete({ where: { cacheKey: options.cacheKey } }).catch(() => {});
      return { kind: "miss" };
    }

    if (
      options.method &&
      row.method &&
      options.method.toUpperCase() !== row.method.toUpperCase()
    ) {
      return { kind: "conflict", reason: "hash_mismatch" };
    }
    if (options.path && row.path && options.path !== row.path) {
      return { kind: "conflict", reason: "hash_mismatch" };
    }

    if (options.requestHash && row.requestHash && row.requestHash !== options.requestHash) {
      return { kind: "conflict", reason: "hash_mismatch" };
    }

    return { kind: "hit", response: { status: row.status, body: row.body } };
  } catch {
    const cached = getFallback(options.cacheKey, options.requestHash);
    return cached ? { kind: "hit", response: cached } : { kind: "miss" };
  }
}

export async function setCachedIdempotentResponse(options: {
  cacheKey: string;
  requestHash?: string | null;
  method?: string | null;
  path?: string | null;
  response: { status: number; body: unknown };
}): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS);
  try {
    await prisma.idempotencyKey.upsert({
      where: { cacheKey: options.cacheKey },
      update: {
        status: options.response.status,
        body: options.response.body as never,
        expiresAt,
        requestHash: options.requestHash ?? undefined,
        method: options.method ?? undefined,
        path: options.path ?? undefined,
      },
      create: {
        cacheKey: options.cacheKey,
        status: options.response.status,
        body: options.response.body as never,
        expiresAt,
        requestHash: options.requestHash ?? undefined,
        method: options.method ?? undefined,
        path: options.path ?? undefined,
      },
    });
  } catch {
    setFallback({
      cacheKey: options.cacheKey,
      requestHash: options.requestHash,
      response: options.response,
    });
  }
}

export async function requestJsonHash(request: Request): Promise<string | null> {
  try {
    const clone = request.clone();
    const raw = await clone.text();
    if (!raw) return sha256Base64Url("");
    return sha256Base64Url(raw);
  } catch {
    return null;
  }
}
