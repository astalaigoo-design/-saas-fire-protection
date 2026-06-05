import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import {
  apiV1Limiter,
  isRateLimitDisabled,
  publicPdfLimiter,
  webhookClerkLimiter,
  webhookPaddleLimiter,
} from "@/lib/rate-limit/limiter";
import type { RateLimitResult } from "@/lib/rate-limit/memory-limiter";

function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    "Retry-After": String(retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}

function tooManyRequests(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

/**
 * Returns a 429 response when a rate limit applies; otherwise null (allow request).
 * Call from middleware before auth handlers.
 */
export async function applyRateLimit(request: Request): Promise<NextResponse | null> {
  if (isRateLimitDisabled()) return null;

  const { pathname } = new URL(request.url);

  if (
    pathname.startsWith("/api/public/reports/") ||
    pathname.startsWith("/api/public/quotes/") ||
    pathname.startsWith("/api/public/portal/")
  ) {
    const ip = getClientIp(request);
    const result = await publicPdfLimiter().limit(`ip:${ip}`);
    if (!result.success) return tooManyRequests(result);
    return null;
  }

  if (pathname === "/api/webhooks/clerk") {
    const result = await webhookClerkLimiter().limit("endpoint");
    if (!result.success) return tooManyRequests(result);
    return null;
  }

  if (pathname === "/api/webhooks/paddle") {
    const result = await webhookPaddleLimiter().limit("endpoint");
    if (!result.success) return tooManyRequests(result);
    return null;
  }

  if (pathname.startsWith("/api/v1/")) {
    const ip = getClientIp(request);
    const result = await apiV1Limiter().limit(`ip:${ip}`);
    if (!result.success) return tooManyRequests(result);
    return null;
  }

  return null;
}
