import { describe, expect, it } from "vitest";
import { resolveScheduleImportRows } from "@/lib/scheduling/import-csv-resolve";
import type { ScheduleImportRow } from "@/lib/scheduling/import-csv-schemas";

const baseRow: ScheduleImportRow = {
  branch: "Main",
  customer: "Acme PM",
  buildingName: "Tower A",
  addressLine1: undefined,
  city: undefined,
  postalCode: undefined,
  inspectionTypeInput: "annual",
  scheduledDate: "2026-08-01",
  scheduledTime: "09:00",
  technicianEmail: undefined,
  recurrence: "none",
  notes: undefined,
};

describe("resolveScheduleImportRows", () => {
  it("marks ready when site and type resolve", () => {
    const { summary } = resolveScheduleImportRows({
      rows: [{ line: 2, data: baseRow }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [{ id: "c1", name: "Acme PM", branchId: "b1" }],
      buildings: [
        {
          id: "bd1",
          customerId: "c1",
          name: "Tower A",
          addressLine1: "100 Main",
          city: "Boston",
          postalCode: "02101",
        },
      ],
      inspectionTypes: [{ id: "t1", code: "annual", name: "Annual Inspection" }],
      technicians: [],
      existingSlotKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.totalVisits).toBe(1);
  });
});
