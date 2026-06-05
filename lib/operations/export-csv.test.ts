import { AssetType, ComplianceStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildDueAssetsCsv, buildPermitsExpiringCsv } from "@/lib/operations/export-csv";
import type { DueAssetExportRow, PermitExpiringExportRow } from "@/lib/operations/export-queries";

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

const samplePermit: PermitExpiringExportRow = {
  buildingId: "bld_1",
  buildingLabel: "Tower A",
  customerName: "Acme",
  fireDistrict: "AFD",
  permitNumber: "SP-2024-01",
  permitExpiresAt: new Date("2026-05-01"),
  status: "expired",
  buildingName: "Tower A",
  buildingTypeLabel: "Commercial",
  addressLine1: "100 Market St",
  addressLine2: null,
  city: "Denver",
  region: "CO",
  postalCode: "80202",
  country: "US",
  buildingComplianceStatus: ComplianceStatus.OVERDUE,
  permitStatusLabel: "Permit expired",
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

describe("buildPermitsExpiringCsv", () => {
  it("includes permit status and expiration columns", () => {
    const csv = buildPermitsExpiringCsv([samplePermit]);
    expect(csv).toContain("Permit status");
    expect(csv).toContain("Permit expired");
    expect(csv).toContain("SP-2024-01");
    expect(csv).toContain("2026-05-01");
  });
});
