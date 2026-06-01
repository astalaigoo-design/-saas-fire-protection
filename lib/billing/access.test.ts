import { SubscriptionStatus } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCompanyAccess } from "@/lib/billing/access";

const NOW = new Date("2026-06-01T12:00:00Z");

describe("resolveCompanyAccess", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("grants access for active and past_due subscriptions", () => {
    expect(
      resolveCompanyAccess({
        subscriptionStatus: SubscriptionStatus.active,
        trialEndsAt: null,
        subscriptionRenewsAt: new Date("2026-07-01"),
      }).hasAccess,
    ).toBe(true);

    expect(
      resolveCompanyAccess({
        subscriptionStatus: SubscriptionStatus.past_due,
        trialEndsAt: null,
        subscriptionRenewsAt: null,
      }).hasAccess,
    ).toBe(true);
  });

  it("allows cancelled access until subscriptionRenewsAt", () => {
    const inGrace = resolveCompanyAccess({
      subscriptionStatus: SubscriptionStatus.cancelled,
      trialEndsAt: null,
      subscriptionRenewsAt: new Date("2026-06-15"),
    });
    expect(inGrace.hasAccess).toBe(true);

    const expired = resolveCompanyAccess({
      subscriptionStatus: SubscriptionStatus.cancelled,
      trialEndsAt: null,
      subscriptionRenewsAt: new Date("2026-05-01"),
    });
    expect(expired.hasAccess).toBe(false);
  });

  it("handles trialing with days left and expired trial", () => {
    const activeTrial = resolveCompanyAccess({
      subscriptionStatus: SubscriptionStatus.trialing,
      trialEndsAt: new Date("2026-06-10"),
      subscriptionRenewsAt: null,
    });
    expect(activeTrial.hasAccess).toBe(true);
    expect(activeTrial.daysLeftInTrial).toBe(9);

    const endedTrial = resolveCompanyAccess({
      subscriptionStatus: SubscriptionStatus.trialing,
      trialEndsAt: new Date("2026-05-20"),
      subscriptionRenewsAt: null,
    });
    expect(endedTrial.hasAccess).toBe(false);
    expect(endedTrial.subscriptionStatus).toBe(SubscriptionStatus.expired);
  });

  it("denies access for expired status without subscription", () => {
    const access = resolveCompanyAccess({
      subscriptionStatus: SubscriptionStatus.expired,
      trialEndsAt: null,
      subscriptionRenewsAt: null,
    });
    expect(access.hasAccess).toBe(false);
    expect(access.message).toContain("Subscribe");
  });
});
