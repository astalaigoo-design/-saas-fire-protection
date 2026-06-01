import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { handlePaddleWebhook } from "@/lib/billing/paddle-webhook";
import { verifyPaddleWebhookSignature } from "@/lib/billing/paddle-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWebhookSecret(): string | null {
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  return secret || null;
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error("Paddle webhook: PADDLE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("Paddle-Signature");

  if (!verifyPaddleWebhookSignature(rawBody, signature, secret)) {
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
    captureRouteError("POST /api/webhooks/paddle", error);
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }
}
