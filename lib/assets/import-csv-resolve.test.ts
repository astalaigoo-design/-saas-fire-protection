import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { resolveAssetImportRows } from "@/lib/assets/import-csv-resolve";
import type { AssetImportRow } from "@/lib/assets/import-csv-schemas";

const baseRow: AssetImportRow = {
  branch: "Main",
  customer: "Acme PM",
  buildingName: "Tower A",
  addressLine1: undefined,
  city: undefined,
  postalCode: undefined,
  assetType: AssetType.fire_extinguisher,
  tagNumber: "FE-1",
  barcodeValue: undefined,
  location: "Lobby",
  manufacturer: undefined,
  model: undefined,
  serialNumber: undefined,
  lastServiceAt: undefined,
  nextServiceDue: undefined,
  notes: undefined,
};

describe("resolveAssetImportRows", () => {
  it("marks ready when building and customer exist", () => {
    const { summary } = resolveAssetImportRows({
      rows: [{ line: 2, data: baseRow }],
      branches: [
        {
          id: "b1",
          name: "Main",
          isDefault: true,
          isImportDefault: true,
          defaultAssetType: null,
          defaultServiceIntervalMonths: null,
        },
      ],
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
      existingAssetKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
  });

  it("errors when customer is missing", () => {
    const { summary } = resolveAssetImportRows({
      rows: [{ line: 2, data: baseRow }],
      branches: [
        {
          id: "b1",
          name: "Main",
          isDefault: true,
          isImportDefault: true,
          defaultAssetType: null,
          defaultServiceIntervalMonths: null,
        },
      ],
      customers: [],
      buildings: [],
      existingAssetKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.errors).toBe(1);
    expect(summary.ready).toBe(0);
  });

  it("uses branch default equipment type when CSV omits asset_type", () => {
    const rowWithoutType = { ...baseRow, assetType: undefined };
    const { summary } = resolveAssetImportRows({
      rows: [{ line: 2, data: rowWithoutType }],
      branches: [
        {
          id: "b1",
          name: "Main",
          isDefault: true,
          isImportDefault: true,
          defaultAssetType: AssetType.hose_cabinet,
          defaultServiceIntervalMonths: 12,
        },
      ],
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
      existingAssetKeys: new Set(),
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
  });
});
