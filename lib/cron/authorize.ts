/** Shared auth for Vercel cron / manual GET hits on `/api/cron/*`. */
export function isCronAuthorized(request: Request, secret = process.env.CRON_SECRET): boolean {
  const trimmed = secret?.trim();
  if (!trimmed) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${trimmed}`) return true;

  return request.headers.get("x-cron-secret") === trimmed;
}
