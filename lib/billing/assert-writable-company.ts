import { resolveCompanyAccess } from "@/lib/billing/access";
import { prisma } from "@/lib/prisma";

export type WritableCompanyResult =
  | { ok: true }
  | { ok: false; error: string; status: 402 | 404 };

export async function assertWritableCompany(
  companyId: string,
): Promise<WritableCompanyResult> {
  const company = await prisma.company.findFirst({
    where: { id: companyId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionRenewsAt: true,
      designPartner: true,
    },
  });

  if (!company) {
    return { ok: false, error: "Company not found.", status: 404 };
  }

  const access = resolveCompanyAccess(company);
  if (!access.hasAccess) {
    return { ok: false, error: access.message, status: 402 };
  }

  return { ok: true };
}
