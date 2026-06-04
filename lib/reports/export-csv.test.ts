import { describe, expect, it } from "vitest";
import { ComplianceStatus } from "@prisma/client";
import {
  buildAhjPermitRegisterCsv,
  buildAssetInventoryCsv,
} from "@/lib/reports/export-csv";
import type {
  AhjPermitRegisterExportRow,
  AssetInventoryExportRow,
} from "@/lib/reports/export-queries";

const sampleAsset: AssetInventoryExportRow = {
  customerName: "Acme",
  buildingName: "HQ",
  buildingLabel: "HQ",
  addressLine1: "1 Main St",
  addressLine2: null,
  city: "Austin",
  region: "TX",
  postalCode: "78701",
  country: "US",
  fireDistrict: "AFD",
  assetTypeLabel: "Fire extinguisher",
  tagNumber: "FE-1",
  barcodeValue: "FE-1",
  location: "Lobby",
  manufacturer: null,
  model: null,
  serialNumber: null,
  lastServiceAt: new Date("2025-01-15"),
  nextServiceDue: new Date("2026-01-15"),
  status: "Active",
  notes: null,
  assetId: "asset_1",
  buildingId: "bld_1",
};

const sampleBuilding: AhjPermitRegisterExportRow = {
  customerName: "Acme",
  buildingName: "HQ",
  buildingLabel: "HQ",
  addressLine1: "1 Main St",
  addressLine2: null,
  city: "Austin",
  region: "TX",
  postalCode: "78701",
  country: "US",
  buildingTypeLabel: "Commercial",
  fireDistrict: "AFD",
  permitNumber: "P-100",
  permitExpiresAt: new Date("2027-06-01"),
  buildingComplianceStatus: ComplianceStatus.PASS,
  buildingId: "bld_1",
};

describe("reports export CSV", () => {
  it("builds asset inventory with BOM and headers", () => {
    const csv = buildAssetInventoryCsv([sampleAsset]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Equipment type");
    expect(csv).toContain("FE-1");
    expect(csv).toContain("Active");
  });

  it("builds AHJ permit register with permit fields", () => {
    const csv = buildAhjPermitRegisterCsv([sampleBuilding]);
    expect(csv).toContain("Permit number");
    expect(csv).toContain("P-100");
    expect(csv).toContain("2027-06-01");
    expect(csv).toContain("Pass");
  });
});
