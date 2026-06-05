import { describe, expect, it } from "vitest";
import {
  planScheduleImportCommit,
  scheduleImportSlotKey,
} from "@/lib/scheduling/import-csv-commit-plan";

describe("planScheduleImportCommit", () => {
  it("counts one visit for non-recurring rows", () => {
    const scheduledAt = new Date("2026-08-01T13:00:00.000Z");
    const plan = planScheduleImportCommit([
      {
        buildingId: "bld_1",
        inspectionTypeId: "type_annual",
        scheduledAt,
        recurrence: "none",
      },
    ]);

    expect(plan.scheduledRows).toBe(1);
    expect(plan.scheduledVisits).toBe(1);
    expect(plan.notifyTargets).toEqual([{ occurrenceCount: 1 }]);
    expect(plan.buildingIds).toEqual(["bld_1"]);
    expect(plan.slotKeys).toHaveLength(1);
  });

  it("expands quarterly recurrence into multiple visits", () => {
    const scheduledAt = new Date("2026-01-15T14:00:00.000Z");
    const plan = planScheduleImportCommit([
      {
        buildingId: "bld_1",
        inspectionTypeId: "type_q",
        scheduledAt,
        recurrence: "quarterly",
      },
    ]);

    expect(plan.scheduledRows).toBe(1);
    expect(plan.scheduledVisits).toBe(4);
    expect(plan.notifyTargets[0]?.occurrenceCount).toBe(4);
    expect(plan.slotKeys).toHaveLength(4);
  });

  it("aggregates multiple ready rows", () => {
    const plan = planScheduleImportCommit([
      {
        buildingId: "bld_1",
        inspectionTypeId: "type_a",
        scheduledAt: new Date("2026-03-01T10:00:00.000Z"),
        recurrence: "none",
      },
      {
        buildingId: "bld_2",
        inspectionTypeId: "type_b",
        scheduledAt: new Date("2026-03-02T10:00:00.000Z"),
        recurrence: "none",
      },
    ]);

    expect(plan.scheduledRows).toBe(2);
    expect(plan.scheduledVisits).toBe(2);
    expect(plan.buildingIds.sort()).toEqual(["bld_1", "bld_2"]);
  });
});

describe("scheduleImportSlotKey", () => {
  it("keys building, minute, and inspection type", () => {
    const key = scheduleImportSlotKey(
      "bld_1",
      new Date("2026-08-01T13:05:00.000Z"),
      "type_1",
    );
    expect(key).toBe("bld_1|2026-08-01T13:05|type_1");
  });
});
