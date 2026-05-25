import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { handlePaddleWebhook } from "@/lib/billing/paddle-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWebhookSecret(): string | null {
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  return secret || null;
}

function parsePaddleSignature(signatureHeader: string | null): {
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

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
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

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error("Paddle webhook: PADDLE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("Paddle-Signature");

  if (!verifySignature(rawBody, signature, secret)) {
    console.error("Paddle webhook: signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await handlePaddleWebhook(payload);
    if (!result.ok) {
      const status = result.retryable ? 500 : 422;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ received: true, action: result.action });
  } catch (error) {
    console.error("Paddle webhook: unhandled error", error);
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }
}
