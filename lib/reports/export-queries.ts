import { ComplianceStatus, InspectionStatus } from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
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

export type CertificateRegisterExportRow = {
  certificateNumber: string;
  reportTemplateKey: string | null;
  generatedAt: Date | null;
  customerName: string;
  buildingLabel: string;
  jurisdictionName: string | null;
  inspectionTypeName: string;
  overallPass: boolean;
  reportId: string;
  inspectionId: string;
};

export async function getCertificateRegisterExportRows(
  session: DashboardSession,
): Promise<CertificateRegisterExportRow[]> {
  const scope = branchScopeFromSession(session);

  const reports = await prisma.report.findMany({
    where: {
      companyId: session.companyId,
      certificateNumber: { not: null },
      inspection: inspectionWhereFromScope(scope, session.companyId),
    },
    select: {
      id: true,
      certificateNumber: true,
      reportTemplateKey: true,
      generatedAt: true,
      inspection: {
        select: {
          id: true,
          building: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              fireDistrict: true,
              jurisdiction: { select: { name: true } },
              customer: { select: { name: true } },
            },
          },
          inspectionType: { select: { name: true } },
          items: { select: { result: true } },
        },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  return reports
    .filter((report): report is typeof report & { certificateNumber: string } =>
      Boolean(report.certificateNumber),
    )
    .map((report) => {
      const building = report.inspection.building;
      const overallPass = !report.inspection.items.some(
        (item) => item.result === "fail" || item.result === "pending",
      );

      return {
        certificateNumber: report.certificateNumber,
        reportTemplateKey: report.reportTemplateKey,
        generatedAt: report.generatedAt,
        customerName: building.customer.name,
        buildingLabel: buildingLabel(building),
        jurisdictionName:
          building.jurisdiction?.name ?? building.fireDistrict ?? null,
        inspectionTypeName: report.inspection.inspectionType.name,
        overallPass,
        reportId: report.id,
        inspectionId: report.inspection.id,
      };
    });
}

export type VisitTimeMileageExportRow = {
  inspectionId: string;
  customerName: string;
  buildingLabel: string;
  inspectionTypeName: string;
  technicianName: string | null;
  scheduledAt: Date;
  arrivedAt: Date | null;
  completedAt: Date | null;
  onSiteMinutes: number | null;
  mileageMiles: number | null;
  hasArrivalGps: boolean;
  hasSubmitGps: boolean;
};

export async function getVisitTimeMileageExportRows(
  session: DashboardSession,
): Promise<VisitTimeMileageExportRow[]> {
  const scope = branchScopeFromSession(session);

  const inspections = await prisma.inspection.findMany({
    where: {
      ...inspectionWhereFromScope(scope, session.companyId),
      status: InspectionStatus.completed,
      completedAt: { not: null },
    },
    select: {
      id: true,
      scheduledAt: true,
      startedAt: true,
      arrivedAt: true,
      completedAt: true,
      mileageMiles: true,
      arrivalLatitude: true,
      arrivalLongitude: true,
      submitLatitude: true,
      submitLongitude: true,
      inspectionType: { select: { name: true } },
      assignedTo: { select: { name: true } },
      building: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 5000,
  });

  return inspections.map((inspection) => {
    const anchor = inspection.arrivedAt ?? inspection.startedAt;
    const onSiteMinutes =
      anchor && inspection.completedAt
        ? Math.max(
            0,
            Math.round(
              (inspection.completedAt.getTime() - anchor.getTime()) / 60_000,
            ),
          )
        : null;

    return {
      inspectionId: inspection.id,
      customerName: inspection.building.customer.name,
      buildingLabel: buildingLabel(inspection.building),
      inspectionTypeName: inspection.inspectionType.name,
      technicianName: inspection.assignedTo?.name?.trim() || null,
      scheduledAt: inspection.scheduledAt,
      arrivedAt: inspection.arrivedAt,
      completedAt: inspection.completedAt,
      onSiteMinutes,
      mileageMiles: inspection.mileageMiles,
      hasArrivalGps:
        inspection.arrivalLatitude != null && inspection.arrivalLongitude != null,
      hasSubmitGps:
        inspection.submitLatitude != null && inspection.submitLongitude != null,
    };
  });
}
