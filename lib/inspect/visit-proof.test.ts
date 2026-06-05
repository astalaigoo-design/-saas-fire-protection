import { describe, expect, it } from "vitest";
import { buildVisitProofSummary, formatOnSiteDuration } from "@/lib/inspect/visit-proof";

describe("buildVisitProofSummary", () => {
  it("computes on-site minutes from arrival to completion", () => {
    const arrivedAt = new Date("2026-06-05T10:00:00");
    const completedAt = new Date("2026-06-05T11:30:00");
    const proof = buildVisitProofSummary({
      startedAt: null,
      arrivedAt,
      completedAt,
      mileageMiles: 12.5,
      arrivalLatitude: 30.27,
      arrivalLongitude: -97.74,
      submitLatitude: 30.27,
      submitLongitude: -97.75,
    });

    expect(proof.onSiteMinutes).toBe(90);
    expect(proof.mileageMiles).toBe(12.5);
    expect(proof.hasArrivalGps).toBe(true);
    expect(proof.hasSubmitGps).toBe(true);
  });
});

describe("formatOnSiteDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatOnSiteDuration(90)).toBe("1h 30m");
    expect(formatOnSiteDuration(45)).toBe("45 min");
  });
});
