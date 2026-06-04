import { describe, expect, it } from "vitest";
import { buildRecurringOccurrenceNote } from "@/lib/scheduling/recurring-assign-notify";

describe("buildRecurringOccurrenceNote", () => {
  it("returns null for a single visit", () => {
    expect(buildRecurringOccurrenceNote(1)).toBeNull();
  });

  it("describes series size for recurring schedules", () => {
    expect(buildRecurringOccurrenceNote(12)).toBe(
      "12 recurring visits were scheduled; this alert is for the first date only.",
    );
  });
});
