import { exportFilename, formatCsvDate, rowsToCsv } from "@/lib/export/csv";
import {
  buildingComplianceLabelForExport,
  getAhjPermitRegisterExportRows,
  getAssetInventoryExportRows,
  getCertificateRegisterExportRows,
  getVisitTimeMileageExportRows,
  type AhjPermitRegisterExportRow,
  type AssetInventoryExportRow,
  type CertificateRegisterExportRow,
  type VisitTimeMileageExportRow,
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

export function buildCertificateRegisterCsv(rows: CertificateRegisterExportRow[]): string {
  const headers = [
    "Certificate number",
    "Issued",
    "Customer",
    "Building",
    "Jurisdiction",
    "Inspection type",
    "Overall result",
    "PDF template",
    "Report ID",
    "Inspection ID",
  ] as const;

  const data = rows.map((row) => [
    row.certificateNumber,
    formatCsvDate(row.generatedAt),
    row.customerName,
    row.buildingLabel,
    row.jurisdictionName ?? "",
    row.inspectionTypeName,
    row.overallPass ? "Pass" : "Fail",
    row.reportTemplateKey ?? "default",
    row.reportId,
    row.inspectionId,
  ]);

  return rowsToCsv(headers, data);
}

export function buildVisitTimeMileageCsv(rows: VisitTimeMileageExportRow[]): string {
  const headers = [
    "Customer",
    "Building",
    "Inspection type",
    "Technician",
    "Scheduled",
    "Checked in",
    "Completed",
    "Time on site (min)",
    "Mileage (mi)",
    "Arrival GPS",
    "Submit GPS",
    "Inspection ID",
  ] as const;

  const data = rows.map((row) => [
    row.customerName,
    row.buildingLabel,
    row.inspectionTypeName,
    row.technicianName ?? "",
    formatCsvDate(row.scheduledAt),
    formatCsvDate(row.arrivedAt),
    formatCsvDate(row.completedAt),
    row.onSiteMinutes ?? "",
    row.mileageMiles ?? "",
    row.hasArrivalGps ? "Yes" : "No",
    row.hasSubmitGps ? "Yes" : "No",
    row.inspectionId,
  ]);

  return rowsToCsv(headers, data);
}

export async function generateReportsExport(input: {
  session: DashboardSession;
  type:
    | "asset-inventory"
    | "ahj-permit-register"
    | "certificate-register"
    | "visit-time-mileage";
}): Promise<{ csv: string; filename: string }> {
  if (input.type === "asset-inventory") {
    const rows = await getAssetInventoryExportRows(input.session);
    return {
      csv: buildAssetInventoryCsv(rows),
      filename: exportFilename("asset-inventory"),
    };
  }

  if (input.type === "certificate-register") {
    const rows = await getCertificateRegisterExportRows(input.session);
    return {
      csv: buildCertificateRegisterCsv(rows),
      filename: exportFilename("certificate-register"),
    };
  }

  if (input.type === "visit-time-mileage") {
    const rows = await getVisitTimeMileageExportRows(input.session);
    return {
      csv: buildVisitTimeMileageCsv(rows),
      filename: exportFilename("visit-time-mileage"),
    };
  }

  const rows = await getAhjPermitRegisterExportRows(input.session);
  return {
    csv: buildAhjPermitRegisterCsv(rows),
    filename: exportFilename("ahj-permit-register"),
  };
}
