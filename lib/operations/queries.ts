import { InspectionStatus, QuoteStatus, ReportStatus } from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
  inspectionWhereFromScope,
  quoteWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { getMonthRange } from "@/lib/dashboard/dates";
import { buildingLabel } from "@/lib/customers/format";
import {
  CADENCE_TYPE_CODES,
  computeDueInspections,
  groupDueByCadence,
  type DueInspectionRow,
} from "@/lib/operations/due-inspections";
import {
  computeDueAssets,
  countDueAssetTotals,
  filterDueAssetsByType,
  groupDueAssetsByType,
  type DueAssetRow,
  type DueAssetTotals,
} from "@/lib/operations/due-assets";
import { AssetType } from "@prisma/client";
import type { DeficiencyRow } from "@/lib/deficiencies/queries";
import { listOpenDeficiencies } from "@/lib/deficiencies/queries";
import { getImportHealthSnapshot, type ImportHealthSnapshot } from "@/lib/operations/import-health";
import {
  buildPermitTrackingRows,
  countPermitTotals,
  type PermitTrackingRow,
  type PermitTrackingTotals,
} from "@/lib/buildings/permit-tracking";
import { prisma } from "@/lib/prisma";

/** @deprecated Use DeficiencyRow — kept for export/legacy references. */
export type OpenDeficiencyRow = DeficiencyRow;

export type PendingQuoteRow = {
  id: string;
  title: string | null;
  totalCents: number;
  currency: string;
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  inspectionId: string;
  lineItemCount: number;
  createdAt: Date;
};

export type SentReportRow = {
  id: string;
  title: string | null;
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  inspectionId: string;
  sentAt: Date;
  sentTo: string | null;
};

export type CommandCenterSnapshot = {
  dueByCadence: ReturnType<typeof groupDueByCadence>;
  dueTotals: {
    overdue: number;
    dueSoon: number;
    neverInspected: number;
  };
  dueAssets: {
    rows: DueAssetRow[];
    extinguishers: DueAssetRow[];
    byType: ReturnType<typeof groupDueAssetsByType>;
    totals: DueAssetTotals;
    serviceMonthLabel: string;
  };
  deficiencies: DeficiencyRow[];
  pendingQuotes: PendingQuoteRow[];
  reportsSentThisMonth: SentReportRow[];
  importHealth: ImportHealthSnapshot;
  permits: {
    rows: PermitTrackingRow[];
    totals: PermitTrackingTotals;
  };
  summary: {
    openDeficiencies: number;
    pendingQuotes: number;
    reportsSentThisMonth: number;
    equipmentOverdue: number;
    equipmentDueThisMonth: number;
    buildingsWithoutRegister: number;
    assetsMissingNextDue: number;
    csvImportsLast90Days: number;
    permitsNeedAttention: number;
  };
};

function countDue(rows: DueInspectionRow[]) {
  return {
    overdue: rows.filter((row) => row.status === "overdue").length,
    dueSoon: rows.filter((row) => row.status === "due_soon").length,
    neverInspected: rows.filter((row) => row.status === "never_inspected").length,
  };
}

export async function getCommandCenterSnapshot(
  session: DashboardSession,
): Promise<CommandCenterSnapshot> {
  const { start: monthStart, end: monthEnd } = getMonthRange();
  const scope = branchScopeFromSession(session);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);
  const inspectionWhere = inspectionWhereFromScope(scope, session.companyId, {
    status: {
      in: [
        InspectionStatus.scheduled,
        InspectionStatus.in_progress,
        InspectionStatus.completed,
      ],
    },
  });

  const [
    buildings,
    inspections,
    inspectionTypes,
    deficiencies,
    pendingQuotes,
    reportsSent,
    registerAssets,
    importHealth,
  ] = await Promise.all([
      prisma.building.findMany({
        where: buildingWhere,
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          fireDistrict: true,
          permitNumber: true,
          permitExpiresAt: true,
          customer: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.inspection.findMany({
        where: inspectionWhere,
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
        select: { code: true, name: true },
        orderBy: { code: "asc" },
      }),
      listOpenDeficiencies(session, { limit: 80 }),
      prisma.quote.findMany({
        where: {
          ...quoteWhereFromScope(scope, session.companyId),
          status: QuoteStatus.draft,
        },
        select: {
          id: true,
          title: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          lineItems: { select: { id: true } },
          inspection: {
            select: {
              id: true,
              inspectionType: { select: { name: true } },
              building: {
                select: {
                  id: true,
                  name: true,
                  addressLine1: true,
                  city: true,
                  customer: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.report.findMany({
        where: {
          inspection: inspectionWhereFromScope(scope, session.companyId),
          OR: [
            { emailedAt: { gte: monthStart, lt: monthEnd } },
            {
              emailedAt: null,
              generatedAt: { gte: monthStart, lt: monthEnd },
              status: ReportStatus.finalized,
            },
          ],
        },
        select: {
          id: true,
          title: true,
          emailedAt: true,
          emailedTo: true,
          generatedAt: true,
          inspection: {
            select: {
              id: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  addressLine1: true,
                  city: true,
                  customer: { select: { name: true } },
                },
              },
              inspectionType: { select: { name: true } },
            },
          },
        },
        orderBy: { emailedAt: "desc" },
        take: 20,
      }),
      prisma.buildingAsset.findMany({
        where: {
          active: true,
          nextServiceDue: { not: null },
          building: buildingWhere,
        },
        select: {
          id: true,
          assetType: true,
          tagNumber: true,
          location: true,
          nextServiceDue: true,
          lastServiceAt: true,
          building: {
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
              customer: { select: { name: true } },
            },
          },
        },
        orderBy: [{ nextServiceDue: "asc" }, { location: "asc" }],
      }),
    getImportHealthSnapshot(session),
  ]);

  const typeCodes =
    inspectionTypes.length > 0
      ? inspectionTypes.map((type) => type.code)
      : [...CADENCE_TYPE_CODES];

  const dueRows = computeDueInspections({ buildings, inspections, typeCodes });
  const dueByCadence = groupDueByCadence(dueRows);
  const dueTotals = countDue(dueRows);

  const permitRows = buildPermitTrackingRows(buildings);
  const permitTotals = countPermitTotals(permitRows);

  const dueAssetRows = computeDueAssets({ assets: registerAssets });
  const dueAssetTotals = countDueAssetTotals(dueAssetRows);
  const serviceMonthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  const pendingQuoteRows: PendingQuoteRow[] = pendingQuotes.map((quote) => ({
    id: quote.id,
    title: quote.title,
    totalCents: quote.totalCents,
    currency: quote.currency,
    buildingId: quote.inspection.building.id,
    buildingLabel: buildingLabel(quote.inspection.building),
    customerName: quote.inspection.building.customer.name,
    inspectionId: quote.inspection.id,
    lineItemCount: quote.lineItems.length,
    createdAt: quote.createdAt,
  }));

  const reportsSentThisMonth: SentReportRow[] = reportsSent.map((report) => ({
    id: report.id,
    title:
      report.title ??
      `${report.inspection.inspectionType.name} report`,
    buildingId: report.inspection.building.id,
    buildingLabel: buildingLabel(report.inspection.building),
    customerName: report.inspection.building.customer.name,
    inspectionId: report.inspection.id,
    sentAt: report.emailedAt ?? report.generatedAt ?? new Date(),
    sentTo: report.emailedTo,
  }));

  return {
    dueByCadence,
    dueTotals,
    dueAssets: {
      rows: dueAssetRows,
      extinguishers: filterDueAssetsByType(dueAssetRows, AssetType.fire_extinguisher),
      byType: groupDueAssetsByType(dueAssetRows),
      totals: dueAssetTotals,
      serviceMonthLabel,
    },
    deficiencies,
    pendingQuotes: pendingQuoteRows,
    reportsSentThisMonth,
    importHealth,
    permits: {
      rows: permitRows,
      totals: permitTotals,
    },
    summary: {
      openDeficiencies: deficiencies.length,
      pendingQuotes: pendingQuoteRows.length,
      reportsSentThisMonth: reportsSentThisMonth.length,
      equipmentOverdue: dueAssetTotals.equipmentOverdue,
      equipmentDueThisMonth: dueAssetTotals.equipmentDueThisMonth,
      buildingsWithoutRegister: importHealth.buildingsWithoutRegister,
      assetsMissingNextDue: importHealth.assetsMissingNextDue,
      csvImportsLast90Days:
        importHealth.recentImports.customers +
        importHealth.recentImports.buildings +
        importHealth.recentImports.equipment +
        importHealth.recentImports.scheduleJobs,
      permitsNeedAttention: permitTotals.needsAttention,
    },
  };
}
