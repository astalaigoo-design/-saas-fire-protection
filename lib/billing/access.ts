import { SubscriptionStatus } from "@prisma/client";
import { TRIAL_DAYS } from "@/lib/billing/constants";

export type CompanyBillingRecord = {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  subscriptionRenewsAt: Date | null;
};

export type CompanyAccess = {
  hasAccess: boolean;
  subscriptionStatus: SubscriptionStatus;
  daysLeftInTrial: number | null;
  trialEndsAt: Date | null;
  subscriptionRenewsAt: Date | null;
  message: string;
};

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function addTrialDays(from: Date = new Date()): Date {
  const trialEndsAt = new Date(from);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
  return trialEndsAt;
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const diffMs = startOfDay(date).getTime() - startOfDay(from).getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function resolveCompanyAccess(company: CompanyBillingRecord): CompanyAccess {
  const now = new Date();
  const trialEndsAt = company.trialEndsAt;
  const daysLeftInTrial =
    company.subscriptionStatus === SubscriptionStatus.trialing && trialEndsAt
      ? daysUntil(trialEndsAt, now)
      : null;

  if (company.subscriptionStatus === SubscriptionStatus.active) {
    return {
      hasAccess: true,
      subscriptionStatus: company.subscriptionStatus,
      daysLeftInTrial,
      trialEndsAt,
      subscriptionRenewsAt: company.subscriptionRenewsAt,
      message: "Subscription active.",
    };
  }

  if (company.subscriptionStatus === SubscriptionStatus.past_due) {
    return {
      hasAccess: true,
      subscriptionStatus: company.subscriptionStatus,
      daysLeftInTrial,
      trialEndsAt,
      subscriptionRenewsAt: company.subscriptionRenewsAt,
      message: "Payment is past due. Update billing to avoid interruption.",
    };
  }

  if (company.subscriptionStatus === SubscriptionStatus.cancelled) {
    const graceUntil = company.subscriptionRenewsAt;
    if (graceUntil && graceUntil.getTime() > now.getTime()) {
      return {
        hasAccess: true,
        subscriptionStatus: company.subscriptionStatus,
        daysLeftInTrial,
        trialEndsAt,
        subscriptionRenewsAt: graceUntil,
        message: "Subscription cancelled. Access continues until the current period ends.",
      };
    }

    return {
      hasAccess: false,
      subscriptionStatus: company.subscriptionStatus,
      daysLeftInTrial,
      trialEndsAt,
      subscriptionRenewsAt: company.subscriptionRenewsAt,
      message: "Subscription cancelled. Subscribe again to restore access.",
    };
  }

  if (company.subscriptionStatus === SubscriptionStatus.trialing) {
    if (trialEndsAt && trialEndsAt.getTime() > now.getTime()) {
      return {
        hasAccess: true,
        subscriptionStatus: company.subscriptionStatus,
        daysLeftInTrial,
        trialEndsAt,
        subscriptionRenewsAt: company.subscriptionRenewsAt,
        message: `${daysLeftInTrial ?? TRIAL_DAYS} day${daysLeftInTrial === 1 ? "" : "s"} left in your free trial.`,
      };
    }

    return {
      hasAccess: false,
      subscriptionStatus: SubscriptionStatus.expired,
      daysLeftInTrial: 0,
      trialEndsAt,
      subscriptionRenewsAt: company.subscriptionRenewsAt,
      message: "Your 14-day free trial has ended. Subscribe to continue using GetFlareflow.",
    };
  }

  return {
    hasAccess: false,
    subscriptionStatus: company.subscriptionStatus,
    daysLeftInTrial,
    trialEndsAt,
    subscriptionRenewsAt: company.subscriptionRenewsAt,
    message: "Subscribe to restore access to your account.",
  };
}
