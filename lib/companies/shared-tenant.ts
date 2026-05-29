import type { Company } from "@prisma/client";
import { APP_NAME, DEMO_COMPANY_NAME } from "@/lib/branding";

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name]?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Clerk user IDs that may intentionally use the shared demo tenant. */
export function isSharedTenantOperator(clerkUserId: string, email?: string | null): boolean {
  const ids = parseCsvEnv("SHARED_TENANT_OPERATOR_CLERK_IDS");
  if (ids.includes(clerkUserId)) return true;

  const emails = parseCsvEnv("SHARED_TENANT_OPERATOR_EMAILS").map((e) => e.toLowerCase());
  if (email && emails.includes(email.toLowerCase())) return true;

  return false;
}

/** Companies used for demos / shared testing — not a user's private tenant. */
export function isSharedTenantCompany(company: Pick<Company, "id" | "name">): boolean {
  const sharedId = process.env.SHARED_TENANT_COMPANY_ID?.trim();
  if (sharedId && company.id === sharedId) return true;
  if (company.name === DEMO_COMPANY_NAME) return true;
  // Legacy production demo workspace (same name as the product).
  if (company.name === APP_NAME) return true;
  return false;
}

/** Stale metadata that points at the shared demo — should not lock users onto demo data. */
export function shouldMigrateOffSharedTenant(
  companyIdFromMetadata: string | null,
  company: Pick<Company, "id" | "name">,
): boolean {
  if (!isSharedTenantCompany(company)) return false;
  if (!companyIdFromMetadata) return true;
  return companyIdFromMetadata === company.id;
}
