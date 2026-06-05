import { describe, expect, it } from "vitest";
import { shouldResetTechnicianDayOfSmsSentAt } from "@/lib/scheduling/technician-day-of-reminders";

describe("shouldResetTechnicianDayOfSmsSentAt", () => {
  const tz = "America/New_York";

  it("returns false when only the time changes on the same day", () => {
    const before = new Date("2026-06-05T14:00:00.000Z");
    const after = new Date("2026-06-05T20:00:00.000Z");
    expect(shouldResetTechnicianDayOfSmsSentAt(before, after, tz)).toBe(false);
  });

  it("returns true when the visit moves to another calendar day", () => {
    const before = new Date("2026-06-05T14:00:00.000Z");
    const after = new Date("2026-06-06T14:00:00.000Z");
    expect(shouldResetTechnicianDayOfSmsSentAt(before, after, tz)).toBe(true);
  });
});
