import { exportFilename, formatCsvDate, rowsToCsv } from "@/lib/export/csv";
import { createZipStore, exportBundleFilename, type ZipStoreEntry } from "@/lib/export/zip-store";
import {
  dueAssetStatusLabelForExport,
  dueStatusLabelForExport,
  getDueAssetsExportRows,
  getDueBuildingsExportRows,
  getFailedItemsExportRows,
  getPermitsExpiringExportRows,
  type DueAssetExportRow,
  type DueBuildingExportRow,
  type FailedItemExportRow,
  type PermitExpiringExportRow,
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

export function buildPermitsExpiringCsv(rows: PermitExpiringExportRow[]): string {
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
    "Permit status",
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
    row.permitStatusLabel,
    complianceLabel(row.buildingComplianceStatus),
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

export type OperationsExportType =
  | "due"
  | "deficiencies"
  | "equipment-due"
  | "permits-expiring"
  | "bundle";

export async function generateOperationsExport(input: {
  session: DashboardSession;
  type: Exclude<OperationsExportType, "bundle">;
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

  if (input.type === "permits-expiring") {
    const rows = await getPermitsExpiringExportRows(input.session);
    return {
      csv: buildPermitsExpiringCsv(rows),
      filename: exportFilename("permits-expiring"),
    };
  }

  const rows = await getFailedItemsExportRows(input.session);
  return {
    csv: buildFailedItemsCsv(rows),
    filename: exportFilename("failed-items"),
  };
}

export async function generateOperationsExportBundle(input: {
  session: DashboardSession;
}): Promise<{ zip: Buffer; filename: string }> {
  const [dueBuildings, dueAssets, failedItems, permits] = await Promise.all([
    getDueBuildingsExportRows(input.session),
    getDueAssetsExportRows(input.session),
    getFailedItemsExportRows(input.session),
    getPermitsExpiringExportRows(input.session),
  ]);

  const entries: ZipStoreEntry[] = [
    {
      name: exportFilename("buildings-due"),
      data: Buffer.from(buildDueBuildingsCsv(dueBuildings), "utf8"),
    },
    {
      name: exportFilename("equipment-due"),
      data: Buffer.from(buildDueAssetsCsv(dueAssets), "utf8"),
    },
    {
      name: exportFilename("failed-items"),
      data: Buffer.from(buildFailedItemsCsv(failedItems), "utf8"),
    },
    {
      name: exportFilename("permits-expiring"),
      data: Buffer.from(buildPermitsExpiringCsv(permits), "utf8"),
    },
  ];

  return {
    zip: createZipStore(entries),
    filename: exportBundleFilename("compliance-export"),
  };
}
