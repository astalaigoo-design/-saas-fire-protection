import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import { dispatchClerkWebhookEvent } from "@/lib/clerk/webhook/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clerkEventSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

function getWebhookSecret(): string | null {
  const secret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim() ??
    process.env.CLERK_WEBHOOK_SECRET?.trim();
  return secret || null;
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error("Clerk webhook: CLERK_WEBHOOK_SIGNING_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook signing secret not configured" },
      { status: 500 },
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Clerk webhook: missing Svix headers");
    return NextResponse.json({ error: "Missing Svix signature headers" }, { status: 400 });
  }

  const payload = await request.text();

  let event: unknown;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    console.error("Clerk webhook: signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const parsed = clerkEventSchema.safeParse(event);
  if (!parsed.success) {
    console.error("Clerk webhook: invalid event envelope", parsed.error.flatten());
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  const { type, data } = parsed.data;

  try {
    const result = await dispatchClerkWebhookEvent(type, data);

    if (!result.ok) {
      const status = result.retryable ? 500 : 422;
      console.error("Clerk webhook handler failed:", type, result.error);
      return NextResponse.json(
        { error: result.retryable ? "Webhook processing failed" : "Webhook payload rejected" },
        { status },
      );
    }

    return NextResponse.json({ received: true, action: result.action });
  } catch (error) {
    console.error("Clerk webhook: unhandled error", type, error);
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }
}
