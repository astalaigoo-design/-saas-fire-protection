import { describe, expect, it } from "vitest";
import {
  parsePaddleSignature,
  signPaddleWebhookPayload,
  verifyPaddleWebhookSignature,
} from "@/lib/billing/paddle-signature";

describe("parsePaddleSignature", () => {
  it("parses ts and h1 from Paddle-Signature header", () => {
    expect(parsePaddleSignature("ts=123;h1=abc")).toEqual({
      timestamp: "123",
      signature: "abc",
    });
  });

  it("returns null when header is missing or incomplete", () => {
    expect(parsePaddleSignature(null)).toBeNull();
    expect(parsePaddleSignature("ts=123")).toBeNull();
    expect(parsePaddleSignature("h1=abc")).toBeNull();
  });
});

describe("verifyPaddleWebhookSignature", () => {
  const secret = "test_paddle_webhook_secret";
  const body = JSON.stringify({ event_type: "subscription.created" });

  it("accepts a valid signature", () => {
    const header = signPaddleWebhookPayload(body, secret);
    expect(verifyPaddleWebhookSignature(body, header, secret)).toBe(true);
  });

  it("rejects wrong secret, tampered body, and malformed header", () => {
    const header = signPaddleWebhookPayload(body, secret);
    expect(verifyPaddleWebhookSignature(body, header, "wrong-secret")).toBe(false);
    expect(verifyPaddleWebhookSignature(`${body}x`, header, secret)).toBe(false);
    expect(verifyPaddleWebhookSignature(body, "not-a-paddle-header", secret)).toBe(false);
  });
});
