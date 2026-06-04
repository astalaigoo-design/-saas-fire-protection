import { describe, expect, it } from "vitest";
import {
  pickActiveMembership,
  type UserMembership,
} from "@/lib/dashboard/resolve-membership";

describe("pickActiveMembership", () => {
  it("selects private company membership when metadata matches", () => {
    const membership = {
      id: "user-1",
      companyId: "company-a",
      clerkUserId: "clerk_1",
      company: { id: "company-a", name: "Acme Fire" },
      createdAt: new Date("2026-01-01"),
    } as unknown as UserMembership;

    const chosen = pickActiveMembership([membership], "company-a");
    expect(chosen?.companyId).toBe("company-a");
  });
});
