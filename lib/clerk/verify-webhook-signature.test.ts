import { describe, expect, it } from "vitest";
import {
  signClerkWebhookPayload,
  verifyClerkWebhookSignature,
} from "@/lib/clerk/verify-webhook-signature";

describe("verifyClerkWebhookSignature", () => {
  /** Svix-compatible secret (whsec_ + base64); same shape as Clerk dashboard signing secrets. */
  const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
  const payload = JSON.stringify({ type: "user.created", data: { id: "user_123" } });

  it("verifies a valid Svix-signed payload", () => {
    const headers = signClerkWebhookPayload(secret, payload);
    const event = verifyClerkWebhookSignature(secret, payload, headers);
    expect(event).toMatchObject({ type: "user.created" });
  });

  it("rejects tampered payload or wrong secret", () => {
    const headers = signClerkWebhookPayload(secret, payload);
    expect(() =>
      verifyClerkWebhookSignature(secret, `${payload}x`, headers),
    ).toThrow();
    expect(() =>
      verifyClerkWebhookSignature("whsec_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", payload, headers),
    ).toThrow();
  });

  it("rejects missing signature header fields", () => {
    expect(() =>
      verifyClerkWebhookSignature(secret, payload, {
        "svix-id": "msg_1",
        "svix-timestamp": "1717243200",
        "svix-signature": "v1,invalid",
      }),
    ).toThrow();
  });
});
