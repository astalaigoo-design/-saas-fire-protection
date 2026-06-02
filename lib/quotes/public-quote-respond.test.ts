import { describe, expect, it } from "vitest";
import { publicQuoteResponseSchema } from "@/lib/quotes/public-quote-respond";

describe("publicQuoteResponseSchema", () => {
  it("accepts accept and decline", () => {
    expect(publicQuoteResponseSchema.safeParse({ action: "accept" }).success).toBe(true);
    expect(publicQuoteResponseSchema.safeParse({ action: "decline" }).success).toBe(true);
  });

  it("requires a message for request_changes", () => {
    expect(publicQuoteResponseSchema.safeParse({ action: "request_changes" }).success).toBe(
      false,
    );
    expect(
      publicQuoteResponseSchema.safeParse({
        action: "request_changes",
        message: "Too short",
      }).success,
    ).toBe(false);
    expect(
      publicQuoteResponseSchema.safeParse({
        action: "request_changes",
        message: "Please remove line 3 and adjust labor.",
      }).success,
    ).toBe(true);
  });
});
