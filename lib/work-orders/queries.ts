import type { Prisma } from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
  workOrderWhereFromScope,
} from "@/lib/branches/scope";
import { buildingLabel } from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { OPEN_WORK_ORDER_STATUSES } from "@/lib/work-orders/constants";
import { prisma } from "@/lib/prisma";

const workOrderListSelect = {
  id: true,
  title: true,
  status: true,
  scheduledAt: true,
  completedAt: true,
  createdAt: true,
  building: {
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
      customer: { select: { name: true } },
    },
  },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.WorkOrderSelect;

export type WorkOrderListItem = Prisma.WorkOrderGetPayload<{
  select: typeof workOrderListSelect;
}> & {
  buildingLabel: string;
};

const workOrderDetailSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  scheduledAt: true,
  completedAt: true,
  notes: true,
  deficiencyId: true,
  quoteId: true,
  createdAt: true,
  updatedAt: true,
  building: {
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
      region: true,
      customer: { select: { id: true, name: true } },
    },
  },
  assignedTo: { select: { id: true, name: true } },
  deficiency: { select: { id: true, label: true } },
  quote: { select: { id: true, title: true, status: true } },
  partLines: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      label: true,
      quantity: true,
      unitCents: true,
      partId: true,
      part: { select: { id: true, sku: true, quantityOnHand: true } },
    },
  },
} satisfies Prisma.WorkOrderSelect;

export type WorkOrderDetail = Prisma.WorkOrderGetPayload<{
  select: typeof workOrderDetailSelect;
}>;

function mapListItem(row: Prisma.WorkOrderGetPayload<{ select: typeof workOrderListSelect }>): WorkOrderListItem {
  return {
    ...row,
    buildingLabel: buildingLabel(row.building),
  };
}

export async function listCompanyWorkOrders(
  session: DashboardSession,
): Promise<WorkOrderListItem[]> {
  const scope = branchScopeFromSession(session);
  const rows = await prisma.workOrder.findMany({
    where: workOrderWhereFromScope(scope, session.companyId),
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
    select: workOrderListSelect,
  });
  return rows.map(mapListItem);
}

export async function listOpenWorkOrders(
  session: DashboardSession,
  limit = 30,
): Promise<WorkOrderListItem[]> {
  const scope = branchScopeFromSession(session);
  const rows = await prisma.workOrder.findMany({
    where: workOrderWhereFromScope(scope, session.companyId, {
      status: { in: OPEN_WORK_ORDER_STATUSES },
    }),
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: workOrderListSelect,
  });
  return rows.map(mapListItem);
}

export async function listMyAssignedWorkOrders(
  session: DashboardSession,
): Promise<WorkOrderListItem[]> {
  const rows = await prisma.workOrder.findMany({
    where: {
      companyId: session.companyId,
      assignedToUserId: session.appUserId,
      status: { in: OPEN_WORK_ORDER_STATUSES },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    select: workOrderListSelect,
  });
  return rows.map(mapListItem);
}

export async function getWorkOrderById(
  session: DashboardSession,
  workOrderId: string,
): Promise<WorkOrderDetail | null> {
  const scope = branchScopeFromSession(session);
  return prisma.workOrder.findFirst({
    where: {
      id: workOrderId,
      ...workOrderWhereFromScope(scope, session.companyId),
    },
    select: workOrderDetailSelect,
  });
}

export async function getWorkOrderForSession(
  session: DashboardSession,
  workOrderId: string,
): Promise<WorkOrderDetail | null> {
  if (session.role === "technician") {
    return prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.companyId,
        assignedToUserId: session.appUserId,
      },
      select: workOrderDetailSelect,
    });
  }
  return getWorkOrderById(session, workOrderId);
}

export async function getWorkOrderFormBuildings(session: DashboardSession) {
  const scope = branchScopeFromSession(session);
  return prisma.building.findMany({
    where: buildingWhereFromScope(scope, session.companyId),
    orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
      customer: { select: { name: true } },
    },
  });
}

export async function countOpenWorkOrders(session: DashboardSession): Promise<number> {
  const scope = branchScopeFromSession(session);
  return prisma.workOrder.count({
    where: workOrderWhereFromScope(scope, session.companyId, {
      status: { in: OPEN_WORK_ORDER_STATUSES },
    }),
  });
}
