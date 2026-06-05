import { describe, expect, it } from "vitest";
import { computePermitStatus } from "@/lib/buildings/permit-status";

describe("computePermitStatus", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("flags missing when no AHJ fields", () => {
    expect(computePermitStatus({ permitNumber: null, permitExpiresAt: null, now })).toBe(
      "missing",
    );
  });

  it("flags expired permits", () => {
    expect(
      computePermitStatus({
        permitNumber: "P-1",
        permitExpiresAt: new Date("2026-05-01"),
        now,
      }),
    ).toBe("expired");
  });

  it("flags expiring soon within window", () => {
    expect(
      computePermitStatus({
        permitNumber: "P-2",
        permitExpiresAt: new Date("2026-07-15"),
        now,
      }),
    ).toBe("expiring_soon");
  });

  it("treats permit number without expiry as no_expiry_date", () => {
    expect(
      computePermitStatus({
        permitNumber: "P-3",
        permitExpiresAt: null,
        now,
      }),
    ).toBe("no_expiry_date");
  });
});
