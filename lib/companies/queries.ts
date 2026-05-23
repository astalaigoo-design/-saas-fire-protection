import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type CompanyProfile = {
  id: string;
  name: string;
  reportEmail: string | null;
  reportPhone: string | null;
  reportAddress: string | null;
};

export async function getCompanyProfile(
  session: DashboardSession,
): Promise<CompanyProfile | null> {
  return prisma.company.findFirst({
    where: { id: session.companyId },
    select: {
      id: true,
      name: true,
      reportEmail: true,
      reportPhone: true,
      reportAddress: true,
    },
  });
}
