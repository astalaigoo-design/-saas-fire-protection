import { describe, expect, it } from "vitest";
import {
  branchIdForRole,
  canAssignCustomerToBranch,
  requiresAssignedBranch,
} from "@/lib/branches/user-branch";

describe("user-branch", () => {
  it("owners are company-wide (no branch id)", () => {
    expect(branchIdForRole("owner", "br_1")).toBeNull();
    expect(requiresAssignedBranch("owner")).toBe(false);
  });

  it("admin and technician require a single branch", () => {
    expect(requiresAssignedBranch("admin")).toBe(true);
    expect(requiresAssignedBranch("technician")).toBe(true);
    expect(branchIdForRole("admin", "br_1")).toBe("br_1");
  });

  it("non-owners cannot assign customers outside their branch", () => {
    expect(
      canAssignCustomerToBranch({
        role: "technician",
        userBranchId: "br_a",
        branchId: "br_b",
      }),
    ).toBe(false);
    expect(
      canAssignCustomerToBranch({
        role: "technician",
        userBranchId: "br_a",
        branchId: "br_a",
      }),
    ).toBe(true);
  });
});
