import { describe, expect, it } from "vitest";
import {
  buildingAddressKey,
  resolveBuildingImportRows,
} from "@/lib/buildings/import-csv-resolve";
import type { BuildingImportRow } from "@/lib/buildings/import-csv-schemas";

const baseRow: BuildingImportRow = {
  branch: "West",
  customer: "Acme PM",
  buildingName: "Tower A",
  addressLine1: "100 Main St",
  addressLine2: undefined,
  city: "Boston",
  region: "MA",
  postalCode: "02101",
  country: "US",
  customerEmail: undefined,
  customerPhone: undefined,
  fireDistrict: undefined,
  permitNumber: undefined,
  permitExpiresAt: null,
};

describe("resolveBuildingImportRows", () => {
  it("flags duplicate addresses in file and database", () => {
    const branches = [{ id: "b1", name: "West", isDefault: true }];
    const existingKey = `c1|${buildingAddressKey({
      addressLine1: baseRow.addressLine1,
      city: baseRow.city,
      postalCode: baseRow.postalCode,
    })}`;

    const { resolved, summary } = resolveBuildingImportRows({
      rows: [
        { line: 2, data: baseRow },
        { line: 3, data: { ...baseRow, buildingName: "Tower B" } },
      ],
      branches,
      customers: [{ id: "c1", name: "Acme PM", branchId: "b1" }],
      existingBuildingKeys: new Set([existingKey]),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.duplicates).toBe(2);
    expect(resolved.every((r) => r.status === "duplicate")).toBe(true);
  });

  it("marks new customer when name is unknown in branch", () => {
    const { resolved, summary } = resolveBuildingImportRows({
      rows: [{ line: 2, data: baseRow }],
      branches: [{ id: "b1", name: "West", isDefault: true }],
      customers: [],
      existingBuildingKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.newCustomers).toBe(1);
    expect(resolved[0]?.willCreateCustomer).toBe(true);
  });
});
