import {
  BRANCH_METADATA_KEY,
  COMPANY_METADATA_KEY,
  ROLE_METADATA_KEY,
} from "@/lib/auth/roles";

export function readInviteCompanyId(publicMetadata: unknown): string | null {
  if (!publicMetadata || typeof publicMetadata !== "object") return null;
  const raw = (publicMetadata as Record<string, unknown>)[COMPANY_METADATA_KEY];
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readInviteRole(publicMetadata: unknown): string {
  if (!publicMetadata || typeof publicMetadata !== "object") return "technician";
  const raw = (publicMetadata as Record<string, unknown>)[ROLE_METADATA_KEY];
  return typeof raw === "string" ? raw : "technician";
}

export function readInviteBranchId(publicMetadata: unknown): string | null {
  if (!publicMetadata || typeof publicMetadata !== "object") return null;
  const raw = (publicMetadata as Record<string, unknown>)[BRANCH_METADATA_KEY];
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
