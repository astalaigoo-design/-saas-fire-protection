import { describe, expect, it } from "vitest";
import {
  branchScopeFromSession,
  customerWhereFromScope,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";

function session(partial: Partial<DashboardSession>): DashboardSession {
  return {
    clerkUserId: "user_1",
    email: null,
    appUserId: "u1",
    companyId: "co1",
    companyName: "Test Co",
    role: "owner",
    userBranchId: null,
    activeBranchId: null,
    ...partial,
  };
}

describe("branchScopeFromSession", () => {
  it("owner with no filter sees all branches", () => {
    expect(branchScopeFromSession(session({ role: "owner" }))).toEqual({ mode: "all" });
  });

  it("owner with active branch cookie scope filters", () => {
    expect(
      branchScopeFromSession(
        session({ role: "owner", activeBranchId: "br_a" }),
      ),
    ).toEqual({ mode: "branch", branchId: "br_a" });
  });

  it("technician uses assigned branch", () => {
    expect(
      branchScopeFromSession(
        session({ role: "technician", userBranchId: "br_b" }),
      ),
    ).toEqual({ mode: "branch", branchId: "br_b" });
  });
});

describe("customerWhereFromScope", () => {
  it("adds branchId when scoped", () => {
    expect(
      customerWhereFromScope({ mode: "branch", branchId: "br_x" }, "co1"),
    ).toEqual({ companyId: "co1", branchId: "br_x" });
  });
});

describe("inspectionWhereFromScope", () => {
  it("narrows inspections via building customer branch", () => {
    expect(
      inspectionWhereFromScope({ mode: "branch", branchId: "br_x" }, "co1"),
    ).toMatchObject({
      companyId: "co1",
      building: { customer: { companyId: "co1", branchId: "br_x" } },
    });
  });
});
