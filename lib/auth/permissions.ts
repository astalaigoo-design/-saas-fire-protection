import type { AppRole } from "./roles";

/** Owner: full access. */
export function isOwner(role: AppRole | null): boolean {
  return role === "owner";
}

/** Admin: manage jobs and customers (no implied owner-only caps here). */
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

/** Organization / billing / destructive settings — owner only. */
export function canManageOrgSettings(role: AppRole | null): boolean {
  return role === "owner";
}

export function permissionSummary(role: AppRole | null): string[] {
  if (!role) return ["No role in public metadata — assign `role` in Clerk."];
  const lines: string[] = [];
  if (canManageOrgSettings(role)) {
    lines.push("Organization & billing settings");
  }
  if (canManageJobs(role)) lines.push("Create / edit / assign jobs");
  else if (canViewAssignedJobs(role)) {
    lines.push("View assigned jobs only (filter by your user id in data layer)");
  }
  if (canManageCustomers(role)) lines.push("Manage customers");
  if (role === "owner") lines.push("Full access (owner)");
  return lines;
}
