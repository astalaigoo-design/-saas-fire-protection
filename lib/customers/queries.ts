import type { Prisma } from "@prisma/client";
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
  companyId: string,
  params: CustomerSearchParams,
): Prisma.CustomerWhereInput {
  const and: Prisma.CustomerWhereInput[] = [{ companyId }];

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
  companyId: string,
  params: CustomerSearchParams,
): Promise<CustomerListItem[]> {
  return prisma.customer.findMany({
    where: buildWhere(companyId, params),
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
  createdAt: true,
  updatedAt: true,
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
  companyId: string,
  customerId: string,
): Promise<CustomerDetail | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    select: customerDetailSelect,
  });
  if (!customer) return null;

  return {
    ...customer,
    buildings: customer.buildings.map(mapCustomerBuilding),
  };
}

export async function getCustomerInspectionHistory(
  companyId: string,
  customerId: string,
): Promise<CustomerInspectionHistoryItem[]> {
  return prisma.inspection.findMany({
    where: {
      companyId,
      building: { customerId },
    },
    orderBy: [{ scheduledAt: "desc" }],
    take: 100,
    select: inspectionHistorySelect,
  });
}
