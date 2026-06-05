import type { AppRole } from "./roles";

/** Owner: full access. */
export function isOwner(role: AppRole | null): boolean {
  return role === "owner";
}

/**
 * Admin: manage jobs and customers within their data scope.
 * There is no separate “branch admin” role — invite `admin` and set `User.branchId` in
 * Organization → Team to limit them to one branch (`lib/branches/scope.ts`).
 */
export function isAdmin(role: AppRole | null): boolean {
  return role === "admin";
}

export function isTechnician(role: AppRole | null): boolean {
  return role === "technician";
}

export function canManageJobs(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageCustomers(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** View any job (lists, detail) — not limited to assignee. */
export function canViewAllJobs(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Technicians should only see jobs assigned to them in queries/UI.
 * Owners and admins may see all jobs.
 */
export function canViewAssignedJobs(role: AppRole | null): boolean {
  return role === "owner" || role === "admin" || role === "technician";
}

/** Full organization settings — owner only (billing, API keys, branches, company profile). */
export function canManageOrgSettings(role: AppRole | null): boolean {
  return role === "owner";
}

/** Organization settings page — owner or branch admin (limited sections). */
export function canAccessOrgSettings(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** Invite and manage technicians on a branch — owner (all) or admin (own branch). */
export function canManageBranchTeam(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** Edit inspection checklist templates — owner or admin. */
export function canManageChecklistTemplates(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** View subscription status and trial — owner or admin (read-only for admin). */
export function canViewBilling(role: AppRole | null): boolean {
  return isOwner(role) || isAdmin(role);
}

/** Subscribe, checkout, and customer portal — owner only. */
export function canManageBilling(role: AppRole | null): boolean {
  return isOwner(role);
}

export function permissionSummary(role: AppRole | null): string[] {
  if (!role) return ["No role in public metadata — assign `role` in Clerk."];
  const lines: string[] = [];
  if (canManageOrgSettings(role)) {
    lines.push("Organization settings (full)");
  } else if (canAccessOrgSettings(role)) {
    lines.push("Branch team & checklist templates");
  }
  if (canManageBilling(role)) {
    lines.push("Billing & subscriptions (manage)");
  } else if (canViewBilling(role)) {
    lines.push("Billing (view only)");
  }
  if (canManageJobs(role)) lines.push("Create / edit / assign jobs");
  else if (canViewAssignedJobs(role)) {
    lines.push("View assigned jobs only (filter by your user id in data layer)");
  }
  if (canManageCustomers(role)) lines.push("Manage customers");
  if (role === "owner") lines.push("Full access (owner)");
  return lines;
}
