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
      designPartner: true,
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

export type WritableTenantResult = { ok: true } | { ok: false; error: string };

/** @deprecated Use WritableTenantResult */
export type ActiveBillingResult = WritableTenantResult;

export async function assertActiveCompanyAccess(
  session: DashboardSession,
): Promise<WritableTenantResult> {
  const access = await resolveSessionCompanyAccess(session);
  if (!access) {
    return { ok: false, error: "Company not found." };
  }
  if (!access.hasAccess) {
    return { ok: false, error: access.message };
  }
  return { ok: true };
}

/** Call at the start of dashboard server actions that mutate tenant data. */
export async function requireWritableTenant(
  session: DashboardSession,
): Promise<WritableTenantResult> {
  return assertActiveCompanyAccess(session);
}

/** @deprecated Use requireWritableTenant */
export async function requireActiveCompanyBilling(
  session: DashboardSession,
): Promise<WritableTenantResult> {
  return requireWritableTenant(session);
}
