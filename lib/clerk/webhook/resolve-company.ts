import { createCompanyWithDefaults } from "@/lib/companies/bootstrap-company";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/branding";

/**
 * Resolve tenant for a new Clerk user.
 * Priority: publicMetadata.companyId → CLERK_DEFAULT_COMPANY_ID → oldest company.
 */
export async function resolveCompanyIdForClerkUser(
  companyIdFromMetadata: string | null,
): Promise<{ companyId: string } | { error: string }> {
  if (companyIdFromMetadata) {
    const company = await prisma.company.findUnique({
      where: { id: companyIdFromMetadata },
      select: { id: true },
    });
    if (company) return { companyId: company.id };
    console.error(
      "Clerk webhook: companyId in public_metadata not found:",
      companyIdFromMetadata,
    );
  }

  const envDefault = process.env.CLERK_DEFAULT_COMPANY_ID?.trim();
  if (envDefault) {
    const company = await prisma.company.findUnique({
      where: { id: envDefault },
      select: { id: true },
    });
    if (company) return { companyId: company.id };
    console.error("Clerk webhook: CLERK_DEFAULT_COMPANY_ID not found:", envDefault);
  }

  const fallback = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (fallback) {
    console.warn(
      "Clerk webhook: using fallback company for new user:",
      fallback.name,
      fallback.id,
    );
    return { companyId: fallback.id };
  }

  const bootstrapCompanyName =
    process.env.CLERK_BOOTSTRAP_COMPANY_NAME?.trim() || `${APP_NAME} Company`;

  try {
    const createdCompany = await prisma.$transaction(async (tx) => {
      const existing = await tx.company.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
      });
      if (existing) return existing;

      return createCompanyWithDefaults(bootstrapCompanyName, tx);
    });

    console.warn(
      "Clerk webhook: bootstrapped company for first sign-up:",
      createdCompany.name,
      createdCompany.id,
    );
    return { companyId: createdCompany.id };
  } catch (error) {
    console.error("Clerk webhook: failed to bootstrap first company", error);
    return {
      error:
        "No company exists to assign the user and auto-bootstrap failed. Set CLERK_DEFAULT_COMPANY_ID or run db:seed.",
    };
  }
}
