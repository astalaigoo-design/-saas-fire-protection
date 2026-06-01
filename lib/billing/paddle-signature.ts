import crypto from "node:crypto";

export function parsePaddleSignature(signatureHeader: string | null): {
  timestamp: string;
  signature: string;
} | null {
  if (!signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );

  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature) return null;

  return { timestamp, signature };
}

export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  const parsed = parsePaddleSignature(signatureHeader);
  if (!parsed) return false;

  const signedPayload = `${parsed.timestamp}:${rawBody}`;
  const digest = Buffer.from(
    crypto.createHmac("sha256", secret).update(signedPayload).digest("hex"),
    "utf8",
  );
  const signature = Buffer.from(parsed.signature, "utf8");

  if (digest.length === 0 || signature.length === 0) return false;
  if (digest.length !== signature.length) return false;

  return crypto.timingSafeEqual(digest, signature);
}

/** Build a Paddle-Signature header value for tests and manual verification. */
export function signPaddleWebhookPayload(
  rawBody: string,
  secret: string,
  timestamp = "1234567890",
): string {
  const signedPayload = `${timestamp}:${rawBody}`;
  const h1 = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `ts=${timestamp};h1=${h1}`;
}
