import { currentUser } from "@clerk/nextjs/server";
import type { AppRole } from "@/lib/auth/roles";
import {
  BRANCH_METADATA_KEY,
  COMPANY_METADATA_KEY,
  parseAppRoleFromMetadata,
  resolveAppRole,
} from "@/lib/auth/roles";
import { readBranchCookie, resolveActiveBranchId } from "@/lib/branches/active-branch";
import { ensureUserMembership } from "@/lib/dashboard/resolve-membership";

export type DashboardSession = {
  clerkUserId: string;
  email: string | null;
  appUserId: string;
  companyId: string;
  companyName: string;
  role: AppRole;
  /** Assigned branch for admin/technician; null = company-wide (owner). */
  userBranchId: string | null;
  /** Effective filter (owner cookie or user assignment). */
  activeBranchId: string | null;
};

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const roleFromMetadata = resolveAppRole(
    clerkUser.publicMetadata as Record<string, unknown>,
    clerkUser.unsafeMetadata as Record<string, unknown> | undefined,
  );
  const role = parseAppRoleFromMetadata(
    clerkUser.publicMetadata as Record<string, unknown>,
    clerkUser.unsafeMetadata as Record<string, unknown> | undefined,
  );

  const companyIdRaw = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.[
    COMPANY_METADATA_KEY
  ];
  const companyIdFromMetadata =
    typeof companyIdRaw === "string" && companyIdRaw.trim().length > 0
      ? companyIdRaw.trim()
      : null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;
  const resolvedRole = role ?? roleFromMetadata;

  const branchIdRaw = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.[
    BRANCH_METADATA_KEY
  ];
  const branchIdFromMetadata =
    typeof branchIdRaw === "string" && branchIdRaw.trim().length > 0
      ? branchIdRaw.trim()
      : null;

  const membershipResult = await ensureUserMembership({
    clerkUserId: clerkUser.id,
    email,
    name,
    role: resolvedRole,
    companyIdFromMetadata,
    branchIdFromMetadata,
  });

  if (!membershipResult.ok) {
    console.error(
      "Dashboard session: could not resolve tenant",
      membershipResult.error,
      clerkUser.id,
    );
    return null;
  }

  const appUser = membershipResult.membership;
  const cookieBranchId = await readBranchCookie();
  const activeBranchId = await resolveActiveBranchId({
    companyId: appUser.companyId,
    role: resolvedRole,
    userBranchId: appUser.branchId,
    cookieBranchId,
  });

  return {
    clerkUserId: clerkUser.id,
    email: email ?? appUser.email ?? null,
    appUserId: appUser.id,
    companyId: appUser.companyId,
    companyName: appUser.company.name,
    role: resolvedRole,
    userBranchId: appUser.branchId,
    activeBranchId,
  };
}
