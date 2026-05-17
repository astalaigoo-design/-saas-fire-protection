import { canViewAllJobs } from "@/lib/auth/permissions";
import { getDashboardSession, type DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export async function getInspectSession(): Promise<DashboardSession | null> {
  return getDashboardSession();
}

export async function canAccessInspection(
  session: DashboardSession,
  inspectionId: string,
): Promise<boolean> {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      companyId: session.companyId,
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    select: { id: true },
  });
  return Boolean(inspection);
}
