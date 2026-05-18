import { InspectionStatus, type Prisma } from "@prisma/client";
import { canViewAllJobs } from "@/lib/auth/permissions";
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
  const base: Prisma.InspectionWhereInput = { companyId: session.companyId };
  if (canViewAllJobs(session.role)) return base;
  return { ...base, assignedToUserId: session.appUserId };
}

export async function getDashboardStats(session: DashboardSession) {
  const { start: monthStart, end: monthEnd } = getMonthRange();
  const inspectionWhere = inspectionScope(session);

  const [customerCount, buildingCount, inspectionsThisMonth] = await Promise.all([
    prisma.customer.count({ where: { companyId: session.companyId } }),
    prisma.building.count({
      where: { customer: { companyId: session.companyId } },
    }),
    prisma.inspection.count({
      where: {
        ...inspectionWhere,
        scheduledAt: { gte: monthStart, lt: monthEnd },
      },
    }),
  ]);

  return { customerCount, buildingCount, inspectionsThisMonth };
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

export async function listCompanyReports(companyId: string) {
  return prisma.report.findMany({
    where: { inspection: { companyId } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: reportListSelect,
  });
}
