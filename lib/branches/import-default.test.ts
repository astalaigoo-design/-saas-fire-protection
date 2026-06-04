import { describe, expect, it } from "vitest";
import { resolveImportDefaultBranchId } from "@/lib/branches/import-default";
import type { DashboardSession } from "@/lib/dashboard/session";

function session(partial: Partial<DashboardSession>): DashboardSession {
  return {
    companyId: "co_1",
    appUserId: "u_1",
    role: "owner",
    userBranchId: null,
    activeBranchId: null,
    clerkUserId: "clerk_1",
    ...partial,
  } as DashboardSession;
}

const branches = [
  { id: "b_main", isDefault: true, isImportDefault: false },
  { id: "b_north", isDefault: false, isImportDefault: true },
];

describe("resolveImportDefaultBranchId", () => {
  it("uses owner active branch filter when set", () => {
    expect(
      resolveImportDefaultBranchId(
        session({ activeBranchId: "b_main" }),
        branches,
        "b_main",
      ),
    ).toBe("b_main");
  });

  it("uses import default branch when no active filter", () => {
    expect(resolveImportDefaultBranchId(session({}), branches, "b_main")).toBe("b_north");
  });

  it("uses assigned branch for technicians", () => {
    expect(
      resolveImportDefaultBranchId(
        session({ role: "technician", userBranchId: "b_main" }),
        branches,
        "b_main",
      ),
    ).toBe("b_main");
  });
});
