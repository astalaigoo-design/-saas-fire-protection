import { canViewAllJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
  quoteWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

/** Returns true when the inspection is in the user's company and branch scope. */
export async function canAccessInspectionInScope(
  session: DashboardSession,
  inspectionId: string,
): Promise<boolean> {
  const scope = branchScopeFromSession(session);
  const row = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      ...inspectionWhereFromScope(scope, session.companyId),
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    select: { id: true },
  });
  return Boolean(row);
}

/** Returns true when the quote is in the user's company and branch scope. */
export async function canAccessQuoteInScope(
  session: DashboardSession,
  quoteId: string,
): Promise<boolean> {
  const scope = branchScopeFromSession(session);
  const row = await prisma.quote.findFirst({
    where: { id: quoteId, ...quoteWhereFromScope(scope, session.companyId) },
    select: { id: true },
  });
  return Boolean(row);
}
