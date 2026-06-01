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
