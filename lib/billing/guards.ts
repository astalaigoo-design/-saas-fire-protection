import { resolveCompanyAccess } from "@/lib/billing/access";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

async function resolveSessionCompanyAccess(session: DashboardSession) {
  const company = await prisma.company.findFirst({
    where: { id: session.companyId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionRenewsAt: true,
    },
  });

  if (!company) return null;

  return resolveCompanyAccess(company);
}

export async function hasActiveCompanyAccess(
  session: DashboardSession,
): Promise<boolean> {
  const access = await resolveSessionCompanyAccess(session);
  return access?.hasAccess ?? false;
}

export async function assertActiveCompanyAccess(
  session: DashboardSession,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await resolveSessionCompanyAccess(session);
  if (!access) {
    return { ok: false, error: "Company not found." };
  }
  if (!access.hasAccess) {
    return { ok: false, error: access.message };
  }
  return { ok: true };
}
