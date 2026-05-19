import { prisma } from "@/lib/prisma";

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

  return { error: "No company exists to assign the user. Run db:seed or set CLERK_DEFAULT_COMPANY_ID." };
}
