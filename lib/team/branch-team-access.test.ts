import { describe, expect, it } from "vitest";
import {
  assertBranchAssignmentAllowed,
  canInviteTeamRole,
  teamMemberManageableBySession,
  teamMemberVisibleToSession,
} from "@/lib/team/branch-team-access";
import type { DashboardSession } from "@/lib/dashboard/session";

function session(partial: Partial<DashboardSession> & Pick<DashboardSession, "role">): DashboardSession {
  return {
    clerkUserId: "user_1",
    email: "a@example.com",
    appUserId: "u1",
    companyId: "co1",
    companyName: "Co",
    userBranchId: partial.userBranchId ?? null,
    activeBranchId: partial.activeBranchId ?? null,
    ...partial,
  };
}

describe("branch team access", () => {
  it("admin can only invite technicians", () => {
    const admin = session({ role: "admin", userBranchId: "b1" });
    expect(canInviteTeamRole(admin, "technician")).toBe(true);
    expect(canInviteTeamRole(admin, "admin")).toBe(false);
  });

  it("admin sees only same-branch technicians", () => {
    const admin = session({ role: "admin", userBranchId: "b1" });
    expect(teamMemberVisibleToSession(admin, { role: "technician", branchId: "b1" })).toBe(true);
    expect(teamMemberVisibleToSession(admin, { role: "technician", branchId: "b2" })).toBe(false);
    expect(teamMemberVisibleToSession(admin, { role: "owner", branchId: null })).toBe(false);
  });

  it("admin can manage technicians on their branch only", () => {
    const admin = session({ role: "admin", userBranchId: "b1" });
    expect(teamMemberManageableBySession(admin, { role: "technician", branchId: "b1" })).toBe(
      true,
    );
    expect(teamMemberManageableBySession(admin, { role: "admin", branchId: "b1" })).toBe(false);
  });

  it("admin cannot assign to other branches", () => {
    const admin = session({ role: "admin", userBranchId: "b1" });
    expect(assertBranchAssignmentAllowed(admin, "b1").ok).toBe(true);
    expect(assertBranchAssignmentAllowed(admin, "b2").ok).toBe(false);
  });
});
