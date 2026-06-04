import { createHmac, timingSafeEqual } from "node:crypto";

export const WEBHOOK_SIGNATURE_HEADER = "X-Flareflow-Signature";

/** `sha256=<hex>` HMAC of the raw JSON body. */
export function signWebhookBody(secret: string, body: string): string {
  const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return `sha256=${digest}`;
}

export function verifyWebhookSignature(
  secret: string,
  body: string,
  header: string | null,
): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = signWebhookBody(secret, body);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header.trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
