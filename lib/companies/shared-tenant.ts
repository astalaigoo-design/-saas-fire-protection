import type { Company } from "@prisma/client";
import {
  APP_NAME,
  DEMO_COMPANY_NAME,
  SHARED_DEMO_COMPANY_ID,
  SHARED_DEMO_COMPANY_NAME,
} from "@/lib/branding";

/** Product owners who may use the shared demo workspace; everyone else gets a private tenant. */
export const DEFAULT_SHARED_TENANT_OPERATOR_EMAILS = [
  "astalaigoo@gmail.com",
  "yuri.joseph19@gmail.com",
] as const;

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name]?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function operatorEmails(): string[] {
  const fromEnv = parseCsvEnv("SHARED_TENANT_OPERATOR_EMAILS").map((e) => e.toLowerCase());
  const defaults = DEFAULT_SHARED_TENANT_OPERATOR_EMAILS.map((e) => e.toLowerCase());
  return Array.from(new Set([...defaults, ...fromEnv]));
}

/** Clerk user IDs / emails that may intentionally use the shared demo tenant. */
export function isSharedTenantOperator(clerkUserId: string, email?: string | null): boolean {
  const ids = parseCsvEnv("SHARED_TENANT_OPERATOR_CLERK_IDS");
  if (ids.includes(clerkUserId)) return true;

  if (email && operatorEmails().includes(email.toLowerCase())) return true;

  return false;
}

export function sharedTenantCompanyId(): string {
  return process.env.SHARED_TENANT_COMPANY_ID?.trim() || SHARED_DEMO_COMPANY_ID;
}

/** Companies used for demos / shared testing — not a user's private tenant. */
export function isSharedTenantCompany(company: Pick<Company, "id" | "name">): boolean {
  if (company.id === sharedTenantCompanyId()) return true;
  if (company.name === DEMO_COMPANY_NAME) return true;
  if (company.name === SHARED_DEMO_COMPANY_NAME) return true;
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
