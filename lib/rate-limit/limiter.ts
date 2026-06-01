import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  memorySlidingWindowLimit,
  type RateLimitResult,
} from "@/lib/rate-limit/memory-limiter";

export type RateLimiter = {
  limit: (key: string) => Promise<RateLimitResult>;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isRateLimitDisabled(): boolean {
  const flag = process.env.RATE_LIMIT_DISABLED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function upstashRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function createLimiter(namespace: string, limit: number, window: `${number} m`): RateLimiter {
  const redis = upstashRedis();
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `flareflow:${namespace}`,
      analytics: true,
    });
    return {
      limit: async (key: string) => {
        const result = await ratelimit.limit(key);
        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        };
      },
    };
  }

  return {
    limit: async (key: string) =>
      memorySlidingWindowLimit({
        namespace,
        key,
        limit,
        window,
      }),
  };
}

/** Public compliance / quote PDF endpoints — per client IP. */
export function publicPdfLimiter(): RateLimiter {
  const limit = envInt("RATE_LIMIT_PUBLIC_PDF_PER_MIN", 30);
  return createLimiter("public-pdf", limit, "1 m");
}

/**
 * Webhook flood protection (signature verification remains primary for Clerk/Paddle).
 * Global per endpoint — not per IP (vendor traffic often shares egress IPs).
 */
export function webhookClerkLimiter(): RateLimiter {
  const limit = envInt("RATE_LIMIT_WEBHOOK_CLERK_PER_MIN", 300);
  return createLimiter("webhook-clerk", limit, "1 m");
}

export function webhookPaddleLimiter(): RateLimiter {
  const limit = envInt("RATE_LIMIT_WEBHOOK_PADDLE_PER_MIN", 300);
  return createLimiter("webhook-paddle", limit, "1 m");
}
