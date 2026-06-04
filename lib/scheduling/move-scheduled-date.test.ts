import { describe, expect, it } from "vitest";
import { moveScheduledToDate } from "@/lib/scheduling/move-scheduled-date";

describe("moveScheduledToDate", () => {
  it("preserves time-of-day on the new date", () => {
    const original = new Date(2026, 5, 10, 14, 30, 0);
    const moved = moveScheduledToDate(original, "2026-06-20");
    expect(moved?.getFullYear()).toBe(2026);
    expect(moved?.getMonth()).toBe(5);
    expect(moved?.getDate()).toBe(20);
    expect(moved?.getHours()).toBe(14);
    expect(moved?.getMinutes()).toBe(30);
  });

  it("returns null for invalid dates", () => {
    const original = new Date(2026, 0, 1, 9, 0, 0);
    expect(moveScheduledToDate(original, "not-a-date")).toBeNull();
  });
});
