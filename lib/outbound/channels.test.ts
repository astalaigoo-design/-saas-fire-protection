import { describe, expect, it, afterEach } from "vitest";
import {
  getOutboundChannelsStatus,
  needsOutboundEmailSetup,
} from "@/lib/outbound/channels";

describe("outbound channels", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("flags setup needed when Resend env is missing", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.REPORT_EMAIL_FROM;
    const status = getOutboundChannelsStatus();
    expect(needsOutboundEmailSetup(status)).toBe(true);
    expect(status.email.configured).toBe(false);
  });
});
