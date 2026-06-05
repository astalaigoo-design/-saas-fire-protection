import { exportFilename, formatCsvDate, rowsToCsv } from "@/lib/export/csv";
import {
  dueAssetStatusLabelForExport,
  dueStatusLabelForExport,
  getDueAssetsExportRows,
  getDueBuildingsExportRows,
  getFailedItemsExportRows,
  type DueAssetExportRow,
  type DueBuildingExportRow,
  type FailedItemExportRow,
} from "@/lib/operations/export-queries";
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

function complianceLabel(status: string): string {
  switch (status) {
    case "PASS":
      return "Pass";
    case "FAIL":
      return "Fail";
    case "OVERDUE":
      return "Overdue";
    case "PENDING":
      return "Pending";
    default:
      return status;
  }
}

export function buildDueBuildingsCsv(rows: DueBuildingExportRow[]): string {
  const headers = [
    "Customer",
    "Building name",
    "Street address",
    "City",
    "State",
    "ZIP",
    "Country",
    "Fire district",
    "Building compliance",
    "Inspection type",
    "Due status",
    "Due date",
    "Last completed",
    "Building ID",
    "Inspection type code",
  ] as const;

  const data = rows.map((row) => [
    row.customerName,
    row.buildingName ?? "",
    formatStreetAddress(row),
    row.city,
    row.region,
    row.postalCode,
    row.country,
    row.fireDistrict ?? "",
    complianceLabel(row.buildingComplianceStatus),
    row.inspectionTypeName,
    dueStatusLabelForExport(row.status),
    formatCsvDate(row.dueAt),
    formatCsvDate(row.lastCompletedAt),
    row.buildingId,
    row.inspectionTypeCode,
  ]);

  return rowsToCsv(headers, data);
}

export function buildDueAssetsCsv(rows: DueAssetExportRow[]): string {
  const headers = [
    "Customer",
    "Building name",
    "Site label",
    "Street address",
    "City",
    "State",
    "ZIP",
    "Country",
    "Equipment type",
    "Equipment type code",
    "Tag number",
    "Location",
    "Due status",
    "Next service due",
    "Last serviced",
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
    row.assetTypeLabel,
    row.assetType,
    row.tagNumber ?? "",
    row.location,
    dueAssetStatusLabelForExport(row.status),
    formatCsvDate(row.nextServiceDue),
    formatCsvDate(row.lastServiceAt),
    row.assetId,
    row.buildingId,
  ]);

  return rowsToCsv(headers, data);
}

export function buildFailedItemsCsv(rows: FailedItemExportRow[]): string {
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
    "Building compliance",
    "Inspection type",
    "Inspection completed",
    "Checklist item",
    "NFPA citation",
    "Deficiency notes",
    "Quote status",
    "Inspection ID",
    "Checklist item ID",
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
    complianceLabel(row.buildingComplianceStatus),
    row.inspectionTypeName,
    formatCsvDate(row.inspectionCompletedAt),
    row.itemLabel,
    row.nfpaCitation ?? "",
    row.deficiencyNotes ?? "",
    row.quoteStatus ?? "None",
    row.inspectionId,
    row.checklistItemId,
  ]);

  return rowsToCsv(headers, data);
}

export async function generateOperationsExport(input: {
  session: DashboardSession;
  type: "due" | "deficiencies" | "equipment-due";
}): Promise<{ csv: string; filename: string }> {
  if (input.type === "due") {
    const rows = await getDueBuildingsExportRows(input.session);
    return {
      csv: buildDueBuildingsCsv(rows),
      filename: exportFilename("buildings-due"),
    };
  }

  if (input.type === "equipment-due") {
    const rows = await getDueAssetsExportRows(input.session);
    return {
      csv: buildDueAssetsCsv(rows),
      filename: exportFilename("equipment-due"),
    };
  }

  const rows = await getFailedItemsExportRows(input.session);
  return {
    csv: buildFailedItemsCsv(rows),
    filename: exportFilename("failed-items"),
  };
}
