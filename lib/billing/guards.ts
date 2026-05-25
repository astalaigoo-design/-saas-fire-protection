import type { DashboardSession } from "@/lib/dashboard/session";
import { resolveCompanyAccess } from "@/lib/billing/access";
import { prisma } from "@/lib/prisma";

export async function hasActiveCompanyAccess(
  session: DashboardSession,
): Promise<boolean> {
  const company = await prisma.company.findFirst({
    where: { id: session.companyId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionRenewsAt: true,
    },
  });

  if (!company) return false;
  return resolveCompanyAccess(company).hasAccess;
}

export async function assertActiveCompanyAccess(
  session: DashboardSession,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const company = await prisma.company.findFirst({
    where: { id: session.companyId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionRenewsAt: true,
    },
  });

  if (!company) {
    return { ok: false, error: "Company billing status could not be verified." };
  }

  const access = resolveCompanyAccess(company);
  if (!access.hasAccess) {
    return { ok: false, error: access.message };
  }

  return { ok: true };
}
