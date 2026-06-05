import type { UserRole } from "@prisma/client";
import { isOwner } from "@/lib/auth/permissions";
import type { DashboardSession } from "@/lib/dashboard/session";
import type { InvitableTeamRole } from "@/lib/team/invite-schemas";

export type BranchTeamScope =
  | { mode: "company" }
  | { mode: "branch"; branchId: string };

export function branchTeamScopeFromSession(session: DashboardSession): BranchTeamScope {
  if (isOwner(session.role)) {
    return { mode: "company" };
  }
  if (session.role === "admin" && session.userBranchId) {
    return { mode: "branch", branchId: session.userBranchId };
  }
  return { mode: "company" };
}

export function adminBranchIdOrError(
  session: DashboardSession,
): { ok: true; branchId: string } | { ok: false; error: string } {
  if (isOwner(session.role)) {
    return { ok: false, error: "Owner has company-wide team access." };
  }
  if (session.role !== "admin" || !session.userBranchId) {
    return { ok: false, error: "Your account is not assigned to a branch." };
  }
  return { ok: true, branchId: session.userBranchId };
}

export function canInviteTeamRole(
  session: DashboardSession,
  role: InvitableTeamRole,
): boolean {
  if (isOwner(session.role)) return true;
  return session.role === "admin" && role === "technician";
}

export function teamMemberVisibleToSession(
  session: DashboardSession,
  member: { role: UserRole; branchId: string | null },
): boolean {
  const scope = branchTeamScopeFromSession(session);
  if (scope.mode === "company") return true;
  if (member.role === "owner") return false;
  return member.branchId === scope.branchId;
}

export function teamMemberManageableBySession(
  session: DashboardSession,
  member: { role: UserRole; branchId: string | null },
): boolean {
  if (member.role === "owner") return false;
  if (isOwner(session.role)) return true;
  if (session.role !== "admin" || !session.userBranchId) return false;
  if (member.role === "admin") return false;
  return member.branchId === session.userBranchId;
}

export function pendingInviteVisibleToSession(
  session: DashboardSession,
  invite: { role: string; branchId: string | null },
): boolean {
  const scope = branchTeamScopeFromSession(session);
  if (scope.mode === "company") return invite.role !== "owner";
  if (invite.role === "owner" || invite.role === "admin") return false;
  return invite.branchId === scope.branchId;
}

export function assertTeamMemberManageable(
  session: DashboardSession,
  member: { role: UserRole; branchId: string | null },
): { ok: true } | { ok: false; error: string } {
  if (!teamMemberManageableBySession(session, member)) {
    return { ok: false, error: "You can only manage technicians on your branch." };
  }
  return { ok: true };
}

export function assertBranchAssignmentAllowed(
  session: DashboardSession,
  branchId: string,
): { ok: true } | { ok: false; error: string } {
  const scope = branchTeamScopeFromSession(session);
  if (scope.mode === "company") return { ok: true };
  if (branchId !== scope.branchId) {
    return { ok: false, error: "You can only assign team members to your branch." };
  }
  return { ok: true };
}
