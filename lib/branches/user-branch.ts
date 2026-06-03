import type { AppRole } from "@/lib/auth/roles";

/**
 * Branch assignment model: one optional `User.branchId` per row — no UserBranch join table.
 * Owners are company-wide (null). Admins and technicians belong to exactly one branch.
 */
export function requiresAssignedBranch(role: AppRole): boolean {
  return role === "admin" || role === "technician";
}

/** Normalize branch id when persisting a user row. */
export function branchIdForRole(role: AppRole, branchId: string | null | undefined): string | null {
  if (role === "owner") return null;
  return branchId ?? null;
}

/** Whether this user may create customers in the given branch. */
export function canAssignCustomerToBranch(input: {
  role: AppRole;
  userBranchId: string | null;
  branchId: string;
}): boolean {
  if (!requiresAssignedBranch(input.role)) return true;
  return input.userBranchId === input.branchId;
}
