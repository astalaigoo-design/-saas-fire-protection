import { describe, expect, it } from "vitest";
import { normalizeSmsPhone } from "@/lib/sms/normalize-phone";

describe("normalizeSmsPhone", () => {
  it("normalizes 10-digit US numbers", () => {
    expect(normalizeSmsPhone("(555) 123-4567")).toBe("+15551234567");
  });

  it("keeps E.164", () => {
    expect(normalizeSmsPhone("+1 555 123 4567")).toBe("+15551234567");
  });

  it("rejects empty", () => {
    expect(normalizeSmsPhone("   ")).toBeNull();
  });
});
