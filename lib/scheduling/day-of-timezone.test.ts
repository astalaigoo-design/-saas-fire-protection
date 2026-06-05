import { describe, expect, it } from "vitest";
import {
  endOfZonedDay,
  getZonedDayBounds,
  isSameZonedCalendarDay,
  isScheduledOnZonedDay,
  startOfZonedDay,
} from "@/lib/scheduling/day-of-timezone";

const TZ = "America/New_York";

describe("day-of timezone", () => {
  it("uses Eastern calendar day when cron runs at 12:00 UTC", () => {
    const instant = new Date("2026-06-05T12:00:00.000Z");
    const bounds = getZonedDayBounds(instant, TZ);
    const job = new Date("2026-06-05T14:00:00.000Z");
    expect(isScheduledOnZonedDay(job, instant, TZ)).toBe(true);
    expect(job >= bounds.start && job < bounds.end).toBe(true);
  });

  it("excludes jobs on the next Eastern day near UTC midnight", () => {
    const reference = new Date("2026-06-05T03:30:00.000Z");
    const tomorrowMorning = new Date("2026-06-06T12:00:00.000Z");
    expect(isScheduledOnZonedDay(tomorrowMorning, reference, TZ)).toBe(false);
  });

  it("start and end bound a full Eastern day", () => {
    const reference = new Date("2026-06-05T16:00:00.000Z");
    const start = startOfZonedDay(reference, TZ);
    const end = endOfZonedDay(reference, TZ);
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(isSameZonedCalendarDay(start, reference, TZ)).toBe(true);
    expect(isSameZonedCalendarDay(new Date(end.getTime() - 1), reference, TZ)).toBe(true);
    expect(isSameZonedCalendarDay(end, reference, TZ)).toBe(false);
  });
});
