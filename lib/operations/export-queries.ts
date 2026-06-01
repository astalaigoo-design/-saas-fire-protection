import {
  ComplianceStatus,
  InspectionItemResult,
  InspectionStatus,
  QuoteStatus,
} from "@prisma/client";
import type { DashboardSession } from "@/lib/dashboard/session";
import { buildingLabel } from "@/lib/customers/format";
import {
  CADENCE_TYPE_CODES,
  computeDueInspections,
  type DueInspectionRow,
} from "@/lib/operations/due-inspections";
import { prisma } from "@/lib/prisma";

export type DueBuildingExportRow = DueInspectionRow & {
  customerName: string;
  buildingName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  fireDistrict: string | null;
  buildingComplianceStatus: ComplianceStatus;
};

export type FailedItemExportRow = {
  checklistItemId: string;
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
  buildingComplianceStatus: ComplianceStatus;
  inspectionId: string;
  inspectionTypeName: string;
  inspectionCompletedAt: Date | null;
  itemLabel: string;
  nfpaCitation: string | null;
  deficiencyNotes: string | null;
  quoteStatus: string | null;
};

const dueStatusLabel: Record<DueInspectionRow["status"], string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  never_inspected: "Not started",
};

export function dueStatusLabelForExport(status: DueInspectionRow["status"]): string {
  return dueStatusLabel[status];
}

export async function getDueBuildingsExportRows(
  session: DashboardSession,
): Promise<DueBuildingExportRow[]> {
  const [buildings, inspections, inspectionTypes] = await Promise.all([
    prisma.building.findMany({
      where: { customer: { companyId: session.companyId } },
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
        currentStatus: true,
        customer: { select: { name: true } },
      },
      orderBy: [{ customer: { name: "asc" } }, { addressLine1: "asc" }],
    }),
    prisma.inspection.findMany({
      where: {
        companyId: session.companyId,
        status: {
          in: [
            InspectionStatus.scheduled,
            InspectionStatus.in_progress,
            InspectionStatus.completed,
          ],
        },
      },
      select: {
        id: true,
        buildingId: true,
        status: true,
        scheduledAt: true,
        completedAt: true,
        recurrenceInterval: true,
        inspectionType: { select: { code: true, name: true } },
      },
    }),
    prisma.inspectionType.findMany({
      where: { companyId: session.companyId },
      select: { code: true },
    }),
  ]);

  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const typeCodes =
    inspectionTypes.length > 0
      ? inspectionTypes.map((type) => type.code)
      : [...CADENCE_TYPE_CODES];

  const dueRows = computeDueInspections({ buildings, inspections, typeCodes });

  return dueRows
    .map((row) => {
      const building = buildingById.get(row.buildingId);
      if (!building) return null;
      return {
        ...row,
        customerName: building.customer.name,
        buildingName: building.name,
        addressLine1: building.addressLine1,
        addressLine2: building.addressLine2,
        city: building.city,
        region: building.region,
        postalCode: building.postalCode,
        country: building.country,
        fireDistrict: building.fireDistrict,
        buildingComplianceStatus: building.currentStatus,
      };
    })
    .filter((row): row is DueBuildingExportRow => row !== null);
}

export async function getFailedItemsExportRows(
  session: DashboardSession,
): Promise<FailedItemExportRow[]> {
  const items = await prisma.inspectionItem.findMany({
    where: {
      result: InspectionItemResult.fail,
      inspection: {
        companyId: session.companyId,
        status: InspectionStatus.completed,
      },
    },
    select: {
      id: true,
      label: true,
      description: true,
      notes: true,
      inspection: {
        select: {
          id: true,
          completedAt: true,
          inspectionType: { select: { name: true } },
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
              currentStatus: true,
              customer: { select: { name: true } },
            },
          },
          quote: { select: { status: true } },
        },
      },
    },
    orderBy: [
      { inspection: { building: { customer: { name: "asc" } } } },
      { inspection: { completedAt: "desc" } },
      { sortOrder: "asc" },
    ],
  });

  return items
    .filter((item) => {
      const quoteStatus = item.inspection.quote?.status;
      return !quoteStatus || quoteStatus === QuoteStatus.draft;
    })
    .map((item) => {
      const building = item.inspection.building;
      return {
        checklistItemId: item.id,
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
        buildingComplianceStatus: building.currentStatus,
        inspectionId: item.inspection.id,
        inspectionTypeName: item.inspection.inspectionType.name,
        inspectionCompletedAt: item.inspection.completedAt,
        itemLabel: item.label,
        nfpaCitation: item.description,
        deficiencyNotes: item.notes,
        quoteStatus: item.inspection.quote?.status ?? null,
      };
    });
}
