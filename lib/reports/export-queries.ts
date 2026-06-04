import { ComplianceStatus } from "@prisma/client";
import { branchScopeFromSession, buildingWhereFromScope } from "@/lib/branches/scope";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingTypeLabel } from "@/lib/buildings/constants";
import { buildingLabel } from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type AssetInventoryExportRow = {
  customerName: string;
  buildingName: string | null;
  buildingLabel: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  fireDistrict: string | null;
  assetTypeLabel: string;
  tagNumber: string | null;
  barcodeValue: string | null;
  location: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  lastServiceAt: Date | null;
  nextServiceDue: Date | null;
  status: "Active" | "Retired";
  notes: string | null;
  assetId: string;
  buildingId: string;
};

export type AhjPermitRegisterExportRow = {
  customerName: string;
  buildingName: string | null;
  buildingLabel: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  buildingTypeLabel: string;
  fireDistrict: string | null;
  permitNumber: string | null;
  permitExpiresAt: Date | null;
  buildingComplianceStatus: ComplianceStatus;
  buildingId: string;
};

function complianceLabel(status: ComplianceStatus): string {
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

export { complianceLabel as buildingComplianceLabelForExport };

export async function getAssetInventoryExportRows(
  session: DashboardSession,
): Promise<AssetInventoryExportRow[]> {
  const scope = branchScopeFromSession(session);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);

  const assets = await prisma.buildingAsset.findMany({
    where: { building: buildingWhere },
    select: {
      id: true,
      assetType: true,
      tagNumber: true,
      barcodeValue: true,
      location: true,
      manufacturer: true,
      model: true,
      serialNumber: true,
      lastServiceAt: true,
      nextServiceDue: true,
      notes: true,
      active: true,
      retiredAt: true,
      building: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          region: true,
          postalCode: true,
          country: true,
          fireDistrict: true,
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { building: { customer: { name: "asc" } } },
      { building: { addressLine1: "asc" } },
      { location: "asc" },
      { tagNumber: "asc" },
    ],
  });

  return assets.map((asset) => {
    const building = asset.building;
    return {
      customerName: building.customer.name,
      buildingName: building.name,
      buildingLabel: buildingLabel(building),
      addressLine1: building.addressLine1,
      addressLine2: building.addressLine2,
      city: building.city,
      region: building.region,
      postalCode: building.postalCode,
      country: building.country,
      fireDistrict: building.fireDistrict,
      assetTypeLabel: assetTypeLabel(asset.assetType),
      tagNumber: asset.tagNumber,
      barcodeValue: asset.barcodeValue,
      location: asset.location,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serialNumber: asset.serialNumber,
      lastServiceAt: asset.lastServiceAt,
      nextServiceDue: asset.nextServiceDue,
      status: asset.active && !asset.retiredAt ? "Active" : "Retired",
      notes: asset.notes,
      assetId: asset.id,
      buildingId: building.id,
    };
  });
}

export async function getAhjPermitRegisterExportRows(
  session: DashboardSession,
): Promise<AhjPermitRegisterExportRow[]> {
  const scope = branchScopeFromSession(session);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);

  const buildings = await prisma.building.findMany({
    where: buildingWhere,
    select: {
      id: true,
      name: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postalCode: true,
      country: true,
      buildingType: true,
      fireDistrict: true,
      permitNumber: true,
      permitExpiresAt: true,
      currentStatus: true,
      customer: { select: { name: true } },
    },
    orderBy: [{ customer: { name: "asc" } }, { addressLine1: "asc" }],
  });

  return buildings.map((building) => ({
    customerName: building.customer.name,
    buildingName: building.name,
    buildingLabel: buildingLabel(building),
    addressLine1: building.addressLine1,
    addressLine2: building.addressLine2,
    city: building.city,
    region: building.region,
    postalCode: building.postalCode,
    country: building.country,
    buildingTypeLabel: buildingTypeLabel(building.buildingType),
    fireDistrict: building.fireDistrict,
    permitNumber: building.permitNumber,
    permitExpiresAt: building.permitExpiresAt,
    buildingComplianceStatus: building.currentStatus,
    buildingId: building.id,
  }));
}
