import type { Prisma } from "@prisma/client";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const partSelect = {
  id: true,
  sku: true,
  name: true,
  description: true,
  unitCents: true,
  quantityOnHand: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartSelect;

export type PartRow = Prisma.PartGetPayload<{ select: typeof partSelect }>;

export async function listCompanyParts(session: DashboardSession): Promise<PartRow[]> {
  return prisma.part.findMany({
    where: { companyId: session.companyId, active: true },
    orderBy: [{ name: "asc" }],
    select: partSelect,
  });
}

export async function getPartInCompany(
  session: DashboardSession,
  partId: string,
): Promise<PartRow | null> {
  return prisma.part.findFirst({
    where: { id: partId, companyId: session.companyId, active: true },
    select: partSelect,
  });
}
