import type { Prisma } from "@prisma/client";
import {
  branchScopeFromSession,
  customerWhereFromScope,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";
import type { CustomerSearchParams } from "@/lib/customers/schemas";
import {
  computeBuildingInspectionStats,
  type BuildingInspectionStats,
} from "@/lib/buildings/stats";

const customerListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  branchId: true,
  branch: { select: { name: true } },
  createdAt: true,
  buildings: {
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
    },
    orderBy: { name: "asc" as const },
  },
  _count: { select: { buildings: true } },
} satisfies Prisma.CustomerSelect;

export type CustomerListItem = Prisma.CustomerGetPayload<{
  select: typeof customerListSelect;
}>;

function buildWhere(
  session: DashboardSession,
  params: CustomerSearchParams,
): Prisma.CustomerWhereInput {
  const scope = branchScopeFromSession(session);
  const and: Prisma.CustomerWhereInput[] = [customerWhereFromScope(scope, session.companyId)];

  if (params.buildings === "with") {
    and.push({ buildings: { some: {} } });
  } else if (params.buildings === "without") {
    and.push({ buildings: { none: {} } });
  }

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        {
          contacts: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          buildings: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { addressLine1: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  return { AND: and };
}

function buildOrderBy(
  sort: CustomerSearchParams["sort"],
): Prisma.CustomerOrderByWithRelationInput {
  switch (sort) {
    case "name_desc":
      return { name: "desc" };
    case "newest":
      return { createdAt: "desc" };
    default:
      return { name: "asc" };
  }
}

export async function listCustomers(
  session: DashboardSession,
  params: CustomerSearchParams,
): Promise<CustomerListItem[]> {
  return prisma.customer.findMany({
    where: buildWhere(session, params),
    orderBy: buildOrderBy(params.sort),
    select: customerListSelect,
  });
}

const customerBuildingInspectionSelect = {
  status: true,
  scheduledAt: true,
  completedAt: true,
  items: { select: { result: true } },
} satisfies Prisma.InspectionSelect;

const customerDetailSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  branchId: true,
  branch: { select: { name: true } },
  portalToken: true,
  portalEnabledAt: true,
  createdAt: true,
  updatedAt: true,
  contacts: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      notes: true,
    },
    orderBy: [{ role: "asc" as const }, { name: "asc" as const }],
  },
  buildings: {
    select: {
      id: true,
      name: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postalCode: true,
      country: true,
      createdAt: true,
      inspections: {
        select: customerBuildingInspectionSelect,
        orderBy: { scheduledAt: "desc" as const },
      },
    },
    orderBy: { name: "asc" as const },
  },
} satisfies Prisma.CustomerSelect;

type CustomerDetailRecord = Prisma.CustomerGetPayload<{
  select: typeof customerDetailSelect;
}>;

type CustomerDetailBuildingRecord = CustomerDetailRecord["buildings"][number];

export type CustomerBuildingCard = Omit<CustomerDetailBuildingRecord, "inspections"> & {
  stats: BuildingInspectionStats;
};

export type CustomerDetail = Omit<CustomerDetailRecord, "buildings"> & {
  buildings: CustomerBuildingCard[];
};

function mapCustomerBuilding(building: CustomerDetailBuildingRecord): CustomerBuildingCard {
  const { inspections, ...rest } = building;
  return {
    ...rest,
    stats: computeBuildingInspectionStats(inspections),
  };
}

const inspectionHistorySelect = {
  id: true,
  scheduledAt: true,
  completedAt: true,
  status: true,
  building: {
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
    },
  },
  inspectionType: { select: { name: true, code: true } },
  assignedTo: { select: { name: true } },
} satisfies Prisma.InspectionSelect;

export type CustomerInspectionHistoryItem = Prisma.InspectionGetPayload<{
  select: typeof inspectionHistorySelect;
}>;

export async function getCustomerById(
  session: DashboardSession,
  customerId: string,
): Promise<CustomerDetail | null> {
  const scope = branchScopeFromSession(session);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...customerWhereFromScope(scope, session.companyId) },
    select: customerDetailSelect,
  });
  if (!customer) return null;

  return {
    ...customer,
    buildings: customer.buildings.map(mapCustomerBuilding),
  };
}

export async function getCustomerInspectionHistory(
  session: DashboardSession,
  customerId: string,
): Promise<CustomerInspectionHistoryItem[]> {
  const scope = branchScopeFromSession(session);
  return prisma.inspection.findMany({
    where: {
      ...inspectionWhereFromScope(scope, session.companyId),
      building: { customerId },
    },
    orderBy: [{ scheduledAt: "desc" }],
    take: 100,
    select: inspectionHistorySelect,
  });
}
