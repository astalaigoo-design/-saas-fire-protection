import { createCompanyWithDefaults } from "@/lib/companies/bootstrap-company";
import { isSharedTenantCompany } from "@/lib/companies/shared-tenant";
import { prisma } from "@/lib/prisma";

export type ResolveCompanyContext = {
  userEmail?: string | null;
  userName?: string | null;
};

/** Display name for a company created on self-serve sign-up (never use the product name alone). */
export function buildCompanyNameForNewSignup(ctx: ResolveCompanyContext): string {
  const name = ctx.userName?.trim();
  if (name) {
    return `${name}'s Fire Protection`;
  }

  const email = ctx.userEmail?.trim();
  if (email) {
    const local = email.split("@")[0] ?? "My";
    const label = local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return `${label} Fire Protection`;
  }

  return "My Fire Protection Company";
}

/**
 * Resolve tenant for a new Clerk user.
 * - Valid publicMetadata.companyId → join that company (invite / admin assignment).
 * - Otherwise → create a dedicated company so the user never shares another tenant's data.
 */
export async function resolveCompanyIdForClerkUser(
  companyIdFromMetadata: string | null,
  ctx: ResolveCompanyContext = {},
): Promise<{ companyId: string } | { error: string }> {
  if (companyIdFromMetadata) {
    const company = await prisma.company.findUnique({
      where: { id: companyIdFromMetadata },
      select: { id: true, name: true },
    });
    if (company) {
      if (isSharedTenantCompany(company)) {
        console.warn(
          "Clerk provisioning: ignoring shared-tenant companyId in metadata; creating private company instead:",
          companyIdFromMetadata,
        );
      } else {
        return { companyId: company.id };
      }
    } else {
      console.warn(
        "Clerk provisioning: ignoring unknown companyId in metadata; creating private company instead:",
        companyIdFromMetadata,
      );
    }
  }

  const companyName = buildCompanyNameForNewSignup(ctx);

  try {
    const company = await createCompanyWithDefaults(companyName);
    console.info(
      "Clerk provisioning: created isolated company for new sign-up:",
      company.name,
      company.id,
    );
    return { companyId: company.id };
  } catch (error) {
    console.error("Clerk provisioning: failed to create company", error);
    return { error: "Failed to create a company for the new user." };
  }
}
