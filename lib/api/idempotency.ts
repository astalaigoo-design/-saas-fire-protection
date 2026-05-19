type CachedResponse = {
  status: number;
  body: unknown;
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000;

const globalStore = globalThis as unknown as {
  __idempotencyResponses?: Map<string, CachedResponse>;
};

function getStore(): Map<string, CachedResponse> {
  if (!globalStore.__idempotencyResponses) {
    globalStore.__idempotencyResponses = new Map<string, CachedResponse>();
  }
  return globalStore.__idempotencyResponses;
}

function pruneExpired(store: Map<string, CachedResponse>) {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) store.delete(key);
  }
}

export function getIdempotencyCacheKey(scope: string, key: string): string {
  return `${scope}:${key}`;
}

export function getCachedIdempotentResponse(
  cacheKey: string,
): CachedResponse | null {
  const store = getStore();
  pruneExpired(store);
  return store.get(cacheKey) ?? null;
}

export function setCachedIdempotentResponse(
  cacheKey: string,
  response: { status: number; body: unknown },
) {
  const store = getStore();
  store.set(cacheKey, {
    status: response.status,
    body: response.body,
    expiresAt: Date.now() + TTL_MS,
  });
}
