import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/branding";

const DEFAULT_BOOTSTRAP_INSPECTION_TYPES = [
  { code: "annual", name: "Annual Inspection" },
  { code: "quarterly", name: "Quarterly Inspection" },
  { code: "monthly", name: "Monthly Inspection" },
] as const;

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

  try {
    const bootstrapCompanyName =
      process.env.CLERK_BOOTSTRAP_COMPANY_NAME?.trim() || `${APP_NAME} Company`;

    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: bootstrapCompanyName },
        select: { id: true, name: true },
      });

      await Promise.all(
        DEFAULT_BOOTSTRAP_INSPECTION_TYPES.map((type) =>
          tx.inspectionType.create({
            data: {
              companyId: company.id,
              code: type.code,
              name: type.name,
            },
          }),
        ),
      );

      return company;
    });

    console.warn(
      "Clerk webhook: bootstrapped first company for new user:",
      created.name,
      created.id,
    );
    return { companyId: created.id };
  } catch (error) {
    console.error("Clerk webhook: failed to bootstrap first company", error);
    return {
      error:
        "No company exists to assign the user and auto-bootstrap failed. Run db:seed or set CLERK_DEFAULT_COMPANY_ID.",
    };
  }
}
