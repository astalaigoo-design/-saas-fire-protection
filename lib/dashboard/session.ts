import type { AppRole } from "@/lib/auth/roles";
import { OperatingMarket } from "@prisma/client";
import {
  BRANCH_METADATA_KEY,
  COMPANY_METADATA_KEY,
  parseAppRoleFromMetadata,
  resolveAppRole,
} from "@/lib/auth/roles";
import { readBranchCookie, resolveActiveBranchId } from "@/lib/branches/active-branch";
import { getClerkProvisioningInput } from "@/lib/dashboard/clerk-provisioning-input";
import { ensureUserMembership } from "@/lib/dashboard/resolve-membership";

export type DashboardSession = {
  clerkUserId: string;
  email: string | null;
  appUserId: string;
  companyId: string;
  companyName: string;
  operatingMarket: OperatingMarket;
  role: AppRole;
  /** Assigned branch for admin/technician; null = company-wide (owner). */
  userBranchId: string | null;
  /** Effective filter (owner cookie or user assignment). */
  activeBranchId: string | null;
};

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const input = await getClerkProvisioningInput();
  if (!input) return null;

  let membershipResult = await ensureUserMembership(input);

  if (!membershipResult.ok && input.companyIdFromMetadata) {
    console.warn(
      "Dashboard session: retrying membership without company metadata",
      membershipResult.error,
      input.clerkUserId,
    );
    membershipResult = await ensureUserMembership({
      ...input,
      companyIdFromMetadata: null,
    });
  }

  if (!membershipResult.ok) {
    console.error(
      "Dashboard session: could not resolve tenant",
      membershipResult.error,
      input.clerkUserId,
    );
    return null;
  }

  const appUser = membershipResult.membership;
  const cookieBranchId = await readBranchCookie();
  const activeBranchId = await resolveActiveBranchId({
    companyId: appUser.companyId,
    role: input.role,
    userBranchId: appUser.branchId,
    cookieBranchId,
  });

  return {
    clerkUserId: input.clerkUserId,
    email: input.email ?? appUser.email ?? null,
    appUserId: appUser.id,
    companyId: appUser.companyId,
    companyName: appUser.company.name,
    operatingMarket: appUser.company.operatingMarket,
    role: input.role,
    userBranchId: appUser.branchId,
    activeBranchId,
  };
}
