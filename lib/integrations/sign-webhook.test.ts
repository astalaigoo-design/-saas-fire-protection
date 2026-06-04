import { describe, expect, it } from "vitest";
import { signWebhookBody, verifyWebhookSignature } from "@/lib/integrations/sign-webhook";

describe("signWebhookBody", () => {
  it("signs and verifies JSON payloads", () => {
    const body = JSON.stringify({ event: "inspection.completed", data: { test: true } });
    const signature = signWebhookBody("secret-123", body);
    expect(signature.startsWith("sha256=")).toBe(true);
    expect(verifyWebhookSignature("secret-123", body, signature)).toBe(true);
    expect(verifyWebhookSignature("wrong", body, signature)).toBe(false);
  });
});
