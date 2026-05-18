/**
 * Application roles stored on each Clerk user under **public metadata**:
 * Dashboard → Users → select user → Public metadata → JSON:
 * `{ "role": "owner" }`  (or `"admin"` | `"technician"`)
 */
export const ROLE_METADATA_KEY = "role" as const;
export const COMPANY_METADATA_KEY = "companyId" as const;

export const APP_ROLES = ["owner", "admin", "technician"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Assigned when Clerk public metadata has no valid role (e.g. self-serve sign-up). */
export const DEFAULT_APP_ROLE: AppRole = "owner";

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

/** Read role from Clerk `publicMetadata` (or `unsafeMetadata` fallback). */
export function parseAppRoleFromMetadata(
  publicMetadata: Record<string, unknown> | undefined | null,
  unsafeMetadata?: Record<string, unknown> | undefined | null,
): AppRole | null {
  const fromPublic = publicMetadata?.[ROLE_METADATA_KEY];
  if (isAppRole(fromPublic)) return fromPublic;
  const fromUnsafe = unsafeMetadata?.[ROLE_METADATA_KEY];
  if (isAppRole(fromUnsafe)) return fromUnsafe;
  return null;
}

/** Role from metadata, or {@link DEFAULT_APP_ROLE} for webhooks and provisioning. */
export function resolveAppRole(
  publicMetadata: Record<string, unknown> | undefined | null,
  unsafeMetadata?: Record<string, unknown> | undefined | null,
): AppRole {
  return parseAppRoleFromMetadata(publicMetadata, unsafeMetadata) ?? DEFAULT_APP_ROLE;
}
