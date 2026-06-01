import type { DashboardSession } from "@/lib/dashboard/session";
import { resolveCompanyAccess, type CompanyAccess } from "@/lib/billing/access";
import { shouldShowPaidCheckout } from "@/lib/billing/design-partner";
import { prisma } from "@/lib/prisma";

export type CompanyBillingSnapshot = CompanyAccess & {
  companyId: string;
  companyName: string;
  designPartner: boolean;
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
      designPartner: true,
    },
  });

  if (!company) return null;

  const access = resolveCompanyAccess(company);
  const showCheckout = shouldShowPaidCheckout(company.designPartner);

  return {
    companyId: company.id,
    companyName: company.name,
    designPartner: company.designPartner,
    checkoutUrl: showCheckout ? buildPaddleCheckoutUrl(company.id, email) : null,
    customerPortalUrl: showCheckout ? getPaddleCustomerPortalUrl() : null,
    ...access,
  };
}

export function buildPaddleCheckoutUrl(
  companyId: string,
  email: string | null,
): string | null {
  const base = process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_URL?.trim();
  if (!base) return null;

  try {
    const url = new URL(base);
    if (email) {
      url.searchParams.set("user_email", email);
    }
    url.searchParams.set("custom_data", JSON.stringify({ company_id: companyId }));
    return url.toString();
  } catch {
    console.error("Invalid NEXT_PUBLIC_PADDLE_CHECKOUT_URL");
    return null;
  }
}

export function getPaddleCustomerPortalUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL?.trim();
  return url || null;
}
