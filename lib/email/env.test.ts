import { afterEach, describe, expect, it } from "vitest";
import {
  getOutboundEmailStatus,
  isOutboundEmailConfigured,
  OUTBOUND_EMAIL_NOT_CONFIGURED,
} from "@/lib/email/env";

describe("outbound email env", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("is false when vars are missing", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.REPORT_EMAIL_FROM;
    expect(isOutboundEmailConfigured()).toBe(false);
    expect(getOutboundEmailStatus().configured).toBe(false);
  });

  it("is true when Resend vars are set", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.REPORT_EMAIL_FROM = "Test <reports@example.com>";
    expect(isOutboundEmailConfigured()).toBe(true);
    expect(getOutboundEmailStatus()).toEqual({
      configured: true,
      fromAddress: "Test <reports@example.com>",
    });
  });

  it("exports a clear cron skip message", () => {
    expect(OUTBOUND_EMAIL_NOT_CONFIGURED).toContain("Resend");
  });
});
