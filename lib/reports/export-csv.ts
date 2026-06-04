import { exportFilename, formatCsvDate, rowsToCsv } from "@/lib/export/csv";
import {
  buildingComplianceLabelForExport,
  getAhjPermitRegisterExportRows,
  getAssetInventoryExportRows,
  type AhjPermitRegisterExportRow,
  type AssetInventoryExportRow,
} from "@/lib/reports/export-queries";
import type { DashboardSession } from "@/lib/dashboard/session";

function formatStreetAddress(building: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
}): string {
  const line2 = building.addressLine2?.trim();
  const cityLine = `${building.city}, ${building.region} ${building.postalCode}`.trim();
  return line2 ? `${building.addressLine1}, ${line2}, ${cityLine}` : `${building.addressLine1}, ${cityLine}`;
}

export function buildAssetInventoryCsv(rows: AssetInventoryExportRow[]): string {
  const headers = [
    "Customer",
    "Building name",
    "Site label",
    "Street address",
    "City",
    "State",
    "ZIP",
    "Country",
    "Fire district",
    "Equipment type",
    "Tag number",
    "Barcode",
    "Location",
    "Manufacturer",
    "Model",
    "Serial number",
    "Status",
    "Last serviced",
    "Next service due",
    "Notes",
    "Asset ID",
    "Building ID",
  ] as const;

  const data = rows.map((row) => [
    row.customerName,
    row.buildingName ?? "",
    row.buildingLabel,
    formatStreetAddress(row),
    row.city,
    row.region,
    row.postalCode,
    row.country,
    row.fireDistrict ?? "",
    row.assetTypeLabel,
    row.tagNumber ?? "",
    row.barcodeValue ?? "",
    row.location,
    row.manufacturer ?? "",
    row.model ?? "",
    row.serialNumber ?? "",
    row.status,
    formatCsvDate(row.lastServiceAt),
    formatCsvDate(row.nextServiceDue),
    row.notes ?? "",
    row.assetId,
    row.buildingId,
  ]);

  return rowsToCsv(headers, data);
}

export function buildAhjPermitRegisterCsv(rows: AhjPermitRegisterExportRow[]): string {
  const headers = [
    "Customer",
    "Building name",
    "Site label",
    "Street address",
    "City",
    "State",
    "ZIP",
    "Country",
    "Building type",
    "Fire district / AHJ",
    "Permit number",
    "Permit expires",
    "Building compliance",
    "Building ID",
  ] as const;

  const data = rows.map((row) => [
    row.customerName,
    row.buildingName ?? "",
    row.buildingLabel,
    formatStreetAddress(row),
    row.city,
    row.region,
    row.postalCode,
    row.country,
    row.buildingTypeLabel,
    row.fireDistrict ?? "",
    row.permitNumber ?? "",
    formatCsvDate(row.permitExpiresAt),
    buildingComplianceLabelForExport(row.buildingComplianceStatus),
    row.buildingId,
  ]);

  return rowsToCsv(headers, data);
}

export async function generateReportsExport(input: {
  session: DashboardSession;
  type: "asset-inventory" | "ahj-permit-register";
}): Promise<{ csv: string; filename: string }> {
  if (input.type === "asset-inventory") {
    const rows = await getAssetInventoryExportRows(input.session);
    return {
      csv: buildAssetInventoryCsv(rows),
      filename: exportFilename("asset-inventory"),
    };
  }

  const rows = await getAhjPermitRegisterExportRows(input.session);
  return {
    csv: buildAhjPermitRegisterCsv(rows),
    filename: exportFilename("ahj-permit-register"),
  };
}
