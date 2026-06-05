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
      assignees: [],
      existingSlotKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.totalVisits).toBe(1);
  });

  it("resolves building without customer when site name is unique in branch", () => {
    const { resolved, summary } = resolveScheduleImportRows({
      rows: [
        {
          line: 2,
          data: { ...baseRow, customer: "", buildingName: "Riverside Plaza" },
        },
      ],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [
        { id: "c1", name: "Acme PM", branchId: "b1" },
        { id: "c2", name: "Other PM", branchId: "b1" },
      ],
      buildings: [
        {
          id: "bd1",
          customerId: "c2",
          name: "Riverside Plaza",
          addressLine1: "50 River Rd",
          city: "Boston",
          postalCode: "02101",
        },
        {
          id: "bd2",
          customerId: "c1",
          name: "Tower A",
          addressLine1: "100 Main",
          city: "Boston",
          postalCode: "02101",
        },
      ],
      inspectionTypes: [{ id: "t1", code: "annual", name: "Annual Inspection" }],
      assignees: [],
      existingSlotKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(resolved[0]?.preview.customer).toBe("Other PM");
    expect(resolved[0]?.preview.site).toContain("Riverside");
  });
});
