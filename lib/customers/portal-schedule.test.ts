import { describe, expect, it } from "vitest";
import {
  buildPortalScheduleNotes,
  portalScheduleDayBounds,
  portalScheduleMaxDate,
  portalScheduleMinDate,
  portalScheduleRequestSchema,
  validatePortalScheduleDate,
} from "@/lib/customers/portal-schedule";

describe("portalScheduleRequestSchema", () => {
  it("accepts a valid schedule request", () => {
    const result = portalScheduleRequestSchema.safeParse({
      buildingId: "bld_1",
      inspectionTypeId: "type_1",
      scheduledDate: "2026-07-01",
      scheduledTime: "09:00",
      notes: "Gate code 1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time slots", () => {
    const result = portalScheduleRequestSchema.safeParse({
      buildingId: "bld_1",
      inspectionTypeId: "type_1",
      scheduledDate: "2026-07-01",
      scheduledTime: "07:30",
    });
    expect(result.success).toBe(false);
  });
});

describe("validatePortalScheduleDate", () => {
  const now = new Date("2026-06-05T12:00:00");

  it("requires at least one day ahead", () => {
    expect(validatePortalScheduleDate("2026-06-05", now)).toMatch(/at least one day/i);
    expect(validatePortalScheduleDate("2026-06-06", now)).toBeNull();
  });

  it("rejects dates beyond the max window", () => {
    const max = portalScheduleMaxDate(now);
    expect(validatePortalScheduleDate(max, now)).toBeNull();
    expect(validatePortalScheduleDate("2099-01-01", now)).toMatch(/within the next/i);
  });
});

describe("portal schedule date bounds", () => {
  it("returns min as tomorrow and max 90 days out", () => {
    const now = new Date("2026-06-05T12:00:00");
    expect(portalScheduleMinDate(now)).toBe("2026-06-06");
    expect(portalScheduleMaxDate(now)).toBe("2026-09-03");
  });
});

describe("buildPortalScheduleNotes", () => {
  it("prefixes customer name for office visibility", () => {
    expect(buildPortalScheduleNotes("Acme Bakery")).toBe("[Customer portal] Acme Bakery");
    expect(buildPortalScheduleNotes("Acme Bakery", "Gate code 1234")).toBe(
      "[Customer portal] Acme Bakery\nGate code 1234",
    );
  });
});

describe("portalScheduleDayBounds", () => {
  it("returns local midnight through next midnight for conflict checks", () => {
    const scheduledAt = new Date("2026-07-01T14:30:00");
    const { dayStart, dayEnd } = portalScheduleDayBounds(scheduledAt);
    expect(dayStart.getHours()).toBe(0);
    expect(dayStart.getMinutes()).toBe(0);
    expect(dayEnd.getTime() - dayStart.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});
