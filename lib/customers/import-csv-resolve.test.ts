import { describe, expect, it } from "vitest";
import { buildingAddressKey } from "@/lib/buildings/import-csv-resolve";
import { resolveCustomerImportRows } from "@/lib/customers/import-csv-resolve";
import type { CustomerImportRow } from "@/lib/customers/import-csv-schemas";

const customerOnly: CustomerImportRow = {
  branch: "Main",
  name: "Acme PM",
  email: "billing@acme.example",
  phone: undefined,
  hasBuildingSite: false,
  buildingName: undefined,
  addressLine1: undefined,
  addressLine2: undefined,
  city: undefined,
  region: undefined,
  postalCode: undefined,
  country: "US",
  fireDistrict: undefined,
  permitNumber: undefined,
  permitExpiresAt: null,
};

const withBuilding: CustomerImportRow = {
  ...customerOnly,
  email: undefined,
  hasBuildingSite: true,
  buildingName: "Tower A",
  addressLine1: "100 Main St",
  city: "Boston",
  region: "MA",
  postalCode: "02101",
};

describe("resolveCustomerImportRows", () => {
  it("marks ready when customer is new in branch", () => {
    const { resolved, summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: customerOnly }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [],
      existingBuildingKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.newCustomers).toBe(1);
    expect(summary.newBuildings).toBe(0);
    expect(resolved[0]?.status).toBe("ready");
  });

  it("flags duplicate when customer-only row already exists in branch", () => {
    const { summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: customerOnly }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [{ id: "c1", name: "Acme PM", branchId: "b1" }],
      existingBuildingKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.duplicates).toBe(1);
    expect(summary.ready).toBe(0);
  });

  it("adds building to existing customer when site columns are present", () => {
    const { resolved, summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: withBuilding }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [{ id: "c1", name: "Acme PM", branchId: "b1" }],
      existingBuildingKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.newCustomers).toBe(0);
    expect(summary.newBuildings).toBe(1);
    expect(resolved[0]?.preview.detail).toContain("existing customer");
  });

  it("creates customer and building when site is new", () => {
    const { summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: withBuilding }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [],
      existingBuildingKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.newCustomers).toBe(1);
    expect(summary.newBuildings).toBe(1);
  });

  it("flags duplicate building address for existing customer", () => {
    const existingKey = `c1|${buildingAddressKey({
      addressLine1: withBuilding.addressLine1!,
      city: withBuilding.city!,
      postalCode: withBuilding.postalCode!,
    })}`;

    const { summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: withBuilding }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [{ id: "c1", name: "Acme PM", branchId: "b1" }],
      existingBuildingKeys: new Set([existingKey]),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.duplicates).toBe(1);
    expect(summary.ready).toBe(0);
  });
});
