type WindowEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Map<string, WindowEntry>>();

function parseWindowMs(window: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(window.trim());
  if (!match) return 60_000;
  const amount = Number.parseInt(match[1]!, 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (multipliers[unit] ?? 60_000);
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export function memorySlidingWindowLimit(input: {
  namespace: string;
  key: string;
  limit: number;
  window: string;
}): RateLimitResult {
  const windowMs = parseWindowMs(input.window);
  const now = Date.now();

  let namespaceBucket = buckets.get(input.namespace);
  if (!namespaceBucket) {
    namespaceBucket = new Map();
    buckets.set(input.namespace, namespaceBucket);
  }

  let entry = namespaceBucket.get(input.key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    namespaceBucket.set(input.key, entry);
  }

  entry.count += 1;

  return {
    success: entry.count <= input.limit,
    limit: input.limit,
    remaining: Math.max(0, input.limit - entry.count),
    reset: entry.resetAt,
  };
}

/** Test helper — clears in-memory buckets. */
export function resetMemoryRateLimitStore(): void {
  buckets.clear();
}
