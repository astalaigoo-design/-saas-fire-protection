import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS,
  nextServiceDueFromInterval,
} from "@/lib/assets/service-intervals";

describe("service-intervals", () => {
  it("exposes default water-system intervals", () => {
    expect(DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS[AssetType.fire_hydrant]).toBe(12);
    expect(DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS[AssetType.standpipe]).toBe(12);
    expect(DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS[AssetType.sprinkler_component]).toBe(3);
  });

  it("computes next due from interval months", () => {
    const lastServiceAt = new Date("2026-01-15T12:00:00Z");
    const nextDue = nextServiceDueFromInterval(lastServiceAt, 12);
    expect(nextDue?.getFullYear()).toBe(2027);
    expect(nextDue?.getMonth()).toBe(0);
  });

  it("rejects invalid interval months", () => {
    expect(nextServiceDueFromInterval(new Date(), 0)).toBeNull();
    expect(nextServiceDueFromInterval(new Date(), 61)).toBeNull();
  });
});
