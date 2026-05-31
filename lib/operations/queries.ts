import { InspectionItemResult, InspectionStatus, QuoteStatus, ReportStatus } from "@prisma/client";
import type { DashboardSession } from "@/lib/dashboard/session";
import { getMonthRange } from "@/lib/dashboard/dates";
import { buildingLabel } from "@/lib/customers/format";
import {
  CADENCE_TYPE_CODES,
  computeDueInspections,
  groupDueByCadence,
  type DueInspectionRow,
} from "@/lib/operations/due-inspections";
import { prisma } from "@/lib/prisma";

export type OpenDeficiencyRow = {
  id: string;
  label: string;
  description: string | null;
  notes: string | null;
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  inspectionId: string;
  inspectionTypeName: string;
  completedAt: Date | null;
  quoteId: string | null;
  quoteStatus: string | null;
};

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
  deficiencies: OpenDeficiencyRow[];
  pendingQuotes: PendingQuoteRow[];
  reportsSentThisMonth: SentReportRow[];
  summary: {
    openDeficiencies: number;
    pendingQuotes: number;
    reportsSentThisMonth: number;
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

  const [buildings, inspections, inspectionTypes, deficiencyItems, pendingQuotes, reportsSent] =
    await Promise.all([
      prisma.building.findMany({
        where: { customer: { companyId: session.companyId } },
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
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
        select: { code: true, name: true },
        orderBy: { code: "asc" },
      }),
      prisma.inspectionItem.findMany({
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
                  city: true,
                  customer: { select: { name: true } },
                },
              },
              quote: { select: { id: true, status: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.quote.findMany({
        where: {
          companyId: session.companyId,
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
          inspection: { companyId: session.companyId },
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
    ]);

  const typeCodes =
    inspectionTypes.length > 0
      ? inspectionTypes.map((type) => type.code)
      : [...CADENCE_TYPE_CODES];

  const dueRows = computeDueInspections({ buildings, inspections, typeCodes });
  const dueByCadence = groupDueByCadence(dueRows);
  const dueTotals = countDue(dueRows);

  const deficiencies: OpenDeficiencyRow[] = deficiencyItems
    .filter((item) => {
      const quoteStatus = item.inspection.quote?.status;
      return !quoteStatus || quoteStatus === QuoteStatus.draft;
    })
    .map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      notes: item.notes,
      buildingId: item.inspection.building.id,
      buildingLabel: buildingLabel(item.inspection.building),
      customerName: item.inspection.building.customer.name,
      inspectionId: item.inspection.id,
      inspectionTypeName: item.inspection.inspectionType.name,
      completedAt: item.inspection.completedAt,
      quoteId: item.inspection.quote?.id ?? null,
      quoteStatus: item.inspection.quote?.status ?? null,
    }));

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
    deficiencies,
    pendingQuotes: pendingQuoteRows,
    reportsSentThisMonth,
    summary: {
      openDeficiencies: deficiencies.length,
      pendingQuotes: pendingQuoteRows.length,
      reportsSentThisMonth: reportsSentThisMonth.length,
    },
  };
}
