/**
 * Paddle Billing client-side token (safe to expose in the browser).
 * Dashboard → Developer tools → Authentication → Client-side tokens.
 */
export function getPaddleClientToken(): string | null {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  return token || null;
}

export function isPaddleClientConfigured(): boolean {
  return Boolean(getPaddleClientToken());
}

/** Live vs sandbox inferred from token prefix (live_ / test_). */
export function getPaddleEnvironment(): "production" | "sandbox" | null {
  const token = getPaddleClientToken();
  if (!token) return null;
  if (token.startsWith("live_")) return "production";
  if (token.startsWith("test_")) return "sandbox";
  return null;
}

/** Paddle price ID (pri_...) for the default subscription plan. */
export function getPaddlePriceId(): string | null {
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID?.trim();
  return priceId || null;
}

/** Client token + price ID — enough to open Paddle.js inline checkout. */
export function isPaddleInlineCheckoutReady(): boolean {
  return Boolean(getPaddleClientToken() && getPaddlePriceId() && getPaddleEnvironment());
}
