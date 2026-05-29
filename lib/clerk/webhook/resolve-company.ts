import { createCompanyWithDefaults } from "@/lib/companies/bootstrap-company";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/branding";

export type ResolveCompanyContext = {
  userEmail?: string | null;
  userName?: string | null;
};

/** Display name for a company created on self-serve sign-up. */
export function buildCompanyNameForNewSignup(ctx: ResolveCompanyContext): string {
  const name = ctx.userName?.trim();
  if (name) {
    return name.includes(APP_NAME) ? name : `${name} — ${APP_NAME}`;
  }

  const email = ctx.userEmail?.trim();
  if (email) {
    const local = email.split("@")[0] ?? "Company";
    const label = local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return `${label} — ${APP_NAME}`;
  }

  return `${APP_NAME} Company`;
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
      select: { id: true },
    });
    if (company) return { companyId: company.id };
    return {
      error: `Company not found for companyId in metadata: ${companyIdFromMetadata}`,
    };
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
