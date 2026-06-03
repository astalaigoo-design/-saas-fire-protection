import { describe, expect, it, vi, beforeEach } from "vitest";
import { SubscriptionStatus } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { requireWritableTenant } from "@/lib/billing/guards";

const session = {
  clerkUserId: "user_clerk_1",
  companyId: "co_1",
  appUserId: "user_1",
  role: "owner" as const,
  email: "owner@example.com",
  companyName: "Test Co",
  userBranchId: null,
  activeBranchId: null,
};

describe("requireWritableTenant", () => {
  beforeEach(() => {
    vi.mocked(prisma.company.findFirst).mockReset();
  });

  it("blocks when subscription has no access", async () => {
    vi.mocked(prisma.company.findFirst).mockResolvedValue({
      subscriptionStatus: SubscriptionStatus.cancelled,
      trialEndsAt: new Date("2020-01-01"),
      subscriptionRenewsAt: null,
      designPartner: false,
    } as Awaited<ReturnType<typeof prisma.company.findFirst>>);

    const result = await requireWritableTenant(session);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("allows design partners", async () => {
    vi.mocked(prisma.company.findFirst).mockResolvedValue({
      subscriptionStatus: SubscriptionStatus.cancelled,
      trialEndsAt: null,
      subscriptionRenewsAt: null,
      designPartner: true,
    } as Awaited<ReturnType<typeof prisma.company.findFirst>>);

    const result = await requireWritableTenant(session);
    expect(result).toEqual({ ok: true });
  });
});
