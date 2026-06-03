import { InspectionStatus, type Prisma } from "@prisma/client";
import { canViewAllJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
  customerWhereFromScope,
  inspectionWhereFromScope,
  quoteWhereFromScope,
} from "@/lib/branches/scope";
import { getMonthRange, getWeekRange } from "@/lib/dashboard/dates";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const inspectionListSelect = {
  id: true,
  scheduledAt: true,
  completedAt: true,
  status: true,
  building: {
    select: {
      name: true,
      addressLine1: true,
      city: true,
      customer: { select: { name: true } },
    },
  },
  inspectionType: { select: { name: true, code: true } },
  assignedTo: { select: { name: true } },
} satisfies Prisma.InspectionSelect;

export type InspectionListItem = Prisma.InspectionGetPayload<{
  select: typeof inspectionListSelect;
}>;

function inspectionScope(session: DashboardSession): Prisma.InspectionWhereInput {
  const scope = branchScopeFromSession(session);
  const base = inspectionWhereFromScope(scope, session.companyId);
  if (canViewAllJobs(session.role)) return base;
  return { ...base, assignedToUserId: session.appUserId };
}

export async function getDashboardStats(session: DashboardSession) {
  const { start: monthStart, end: monthEnd } = getMonthRange();
  const inspectionWhere = inspectionScope(session);
  const scope = branchScopeFromSession(session);
  const customerWhere = customerWhereFromScope(scope, session.companyId);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);

  const [customerCount, buildingCount, inspectionsThisMonth, totalInspectionCount] =
    await Promise.all([
    prisma.customer.count({ where: customerWhere }),
    prisma.building.count({ where: buildingWhere }),
    prisma.inspection.count({
      where: {
        ...inspectionWhere,
        scheduledAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.inspection.count({ where: inspectionWhereFromScope(scope, session.companyId) }),
  ]);

  return { customerCount, buildingCount, inspectionsThisMonth, totalInspectionCount };
}

export async function getUpcomingInspectionsThisWeek(
  session: DashboardSession,
): Promise<InspectionListItem[]> {
  const { start, end } = getWeekRange();

  return prisma.inspection.findMany({
    where: {
      ...inspectionScope(session),
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      scheduledAt: { gte: start, lt: end },
    },
    orderBy: { scheduledAt: "asc" },
    take: 12,
    select: inspectionListSelect,
  });
}

export async function getRecentCompletedInspections(
  session: DashboardSession,
): Promise<InspectionListItem[]> {
  return prisma.inspection.findMany({
    where: {
      ...inspectionScope(session),
      status: InspectionStatus.completed,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: 8,
    select: inspectionListSelect,
  });
}

export async function listInspections(
  session: DashboardSession,
): Promise<InspectionListItem[]> {
  return prisma.inspection.findMany({
    where: inspectionScope(session),
    orderBy: { scheduledAt: "desc" },
    take: 100,
    select: inspectionListSelect,
  });
}

const reportListSelect = {
  id: true,
  title: true,
  status: true,
  generatedAt: true,
  createdAt: true,
  shareToken: true,
  emailedTo: true,
  emailedAt: true,
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
} satisfies Prisma.ReportSelect;

export type ReportListItem = Prisma.ReportGetPayload<{
  select: typeof reportListSelect;
}>;

export async function listCompanyReports(session: DashboardSession) {
  const scope = branchScopeFromSession(session);
  return prisma.report.findMany({
    where: { inspection: inspectionWhereFromScope(scope, session.companyId) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: reportListSelect,
  });
}

const quoteListSelect = {
  id: true,
  shareToken: true,
  title: true,
  status: true,
  notes: true,
  subtotalCents: true,
  taxRateBasisPoints: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  currency: true,
  createdAt: true,
  sentTo: true,
  sentAt: true,
  acceptedAt: true,
  declinedAt: true,
  scheduledInspectionId: true,
  lineItems: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      label: true,
      description: true,
      quantity: true,
      unitPriceCents: true,
      sortOrder: true,
    },
  },
  inspection: {
    select: {
      id: true,
      inspectionType: { select: { name: true } },
      completedAt: true,
      company: { select: { reportEmail: true, name: true } },
      building: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
  },
} satisfies Prisma.QuoteSelect;

export type QuoteListItem = Prisma.QuoteGetPayload<{
  select: typeof quoteListSelect;
}>;

export async function listCompanyQuotes(session: DashboardSession): Promise<QuoteListItem[]> {
  const scope = branchScopeFromSession(session);
  return prisma.quote.findMany({
    where: quoteWhereFromScope(scope, session.companyId),
    orderBy: { createdAt: "desc" },
    take: 100,
    select: quoteListSelect,
  });
}

/** Avoid crashing the app when quote migrations have not been applied yet. */
export async function listCompanyQuotesSafe(session: DashboardSession): Promise<{
  quotes: QuoteListItem[];
  schemaReady: boolean;
}> {
  try {
    const quotes = await listCompanyQuotes(session);
    return { quotes, schemaReady: true };
  } catch (error) {
    console.error("listCompanyQuotes failed", error);
    return { quotes: [], schemaReady: false };
  }
}

export async function listCompanyReportsSafe(session: DashboardSession): Promise<ReportListItem[]> {
  try {
    return await listCompanyReports(session);
  } catch (error) {
    console.error("listCompanyReports failed", error);
    return [];
  }
}
