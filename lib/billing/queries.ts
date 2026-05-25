import type { DashboardSession } from "@/lib/dashboard/session";
import { resolveCompanyAccess, type CompanyAccess } from "@/lib/billing/access";
import { prisma } from "@/lib/prisma";

export type CompanyBillingSnapshot = CompanyAccess & {
  companyId: string;
  companyName: string;
  checkoutUrl: string | null;
  customerPortalUrl: string | null;
};

export async function getCompanyBillingSnapshot(
  session: DashboardSession,
  email: string | null,
): Promise<CompanyBillingSnapshot | null> {
  const company = await prisma.company.findFirst({
    where: { id: session.companyId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionRenewsAt: true,
    },
  });

  if (!company) return null;

  const access = resolveCompanyAccess(company);

  return {
    companyId: company.id,
    companyName: company.name,
    checkoutUrl: buildLemonSqueezyCheckoutUrl(company.id, email),
    customerPortalUrl: getLemonSqueezyCustomerPortalUrl(),
    ...access,
  };
}

export function buildLemonSqueezyCheckoutUrl(
  companyId: string,
  email: string | null,
): string | null {
  const base = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL?.trim();
  if (!base) return null;

  try {
    const url = new URL(base);
    if (email) {
      url.searchParams.set("checkout[email]", email);
    }
    url.searchParams.set("checkout[custom][company_id]", companyId);
    return url.toString();
  } catch {
    console.error("Invalid NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL");
    return null;
  }
}

export function getLemonSqueezyCustomerPortalUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL?.trim();
  return url || null;
}
