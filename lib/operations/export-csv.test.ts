import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildDueAssetsCsv } from "@/lib/operations/export-csv";
import type { DueAssetExportRow } from "@/lib/operations/export-queries";

const sampleRow: DueAssetExportRow = {
  assetId: "asset_1",
  assetType: AssetType.fire_hydrant,
  assetTypeLabel: "Fire hydrant",
  tagNumber: "FH-1",
  location: "North lot",
  buildingId: "bld_1",
  buildingLabel: "Tower A",
  customerName: "Acme",
  status: "overdue",
  nextServiceDue: new Date("2026-05-01"),
  lastServiceAt: new Date("2025-05-01"),
  buildingName: "Tower A",
  addressLine1: "100 Market St",
  addressLine2: null,
  city: "Denver",
  region: "CO",
  postalCode: "80202",
  country: "US",
};

describe("buildDueAssetsCsv", () => {
  it("includes due status and equipment type columns", () => {
    const csv = buildDueAssetsCsv([sampleRow]);
    expect(csv).toContain("Equipment type");
    expect(csv).toContain("Equipment type code");
    expect(csv).toContain("Due status");
    expect(csv).toContain("Fire hydrant");
    expect(csv).toContain("fire_hydrant");
    expect(csv).toContain("Overdue");
    expect(csv).toContain("Acme");
  });
});
