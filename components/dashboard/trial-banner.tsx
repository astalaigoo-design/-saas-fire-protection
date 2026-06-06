import type { CompanyBillingSnapshot } from "@/lib/billing/queries";
import { SubscriptionStatus } from "@prisma/client";
import Link from "next/link";
import type { AppRole } from "@/lib/auth/roles";
import { canManageBilling, canViewBilling } from "@/lib/auth/permissions";
import {
  canShowSubscribeCta,
  resolveSubscribePrimaryLink,
} from "@/lib/billing/subscribe-cta";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TrialBannerProps = {
  billing: CompanyBillingSnapshot;
  role: AppRole;
};

export function TrialBanner({ billing, role }: TrialBannerProps) {
  if (billing.designPartner) return null;

  const showTrial =
    billing.subscriptionStatus === SubscriptionStatus.trialing &&
    billing.hasAccess &&
    billing.daysLeftInTrial != null;
  const showPastDue = billing.subscriptionStatus === SubscriptionStatus.past_due;
  const showExpired = !billing.hasAccess;
  const canManage = canManageBilling(role);
  const canView = canViewBilling(role);

  if (!showTrial && !showPastDue && !showExpired) return null;

  const urgent = showPastDue || showExpired;
  const showSubscribe =
    canShowSubscribeCta({
      checkoutUrl: billing.checkoutUrl,
      inlineCheckoutReady: billing.inlineCheckoutReady,
      designPartner: billing.designPartner,
      canManage,
    }) && (showTrial || showExpired);
  const subscribeLink = showSubscribe
    ? resolveSubscribePrimaryLink({
        checkoutUrl: billing.checkoutUrl,
        inlineCheckoutReady: billing.inlineCheckoutReady,
        urgent: showExpired,
      })
    : null;

  return (
    <div
      className={cn(
        "mt-6 rounded-xl border px-4 py-3 text-sm",
        urgent
          ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          : "border-primary/30 bg-primary/5 text-foreground",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{billing.message}</p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {subscribeLink ? (
            subscribeLink.external ? (
              <a
                href={subscribeLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
              >
                {showExpired ? "Subscribe now" : "Subscribe before trial ends"}
              </a>
            ) : (
              <Link
                href={subscribeLink.href}
                className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
              >
                {showExpired ? "Subscribe now" : "Subscribe before trial ends"}
              </Link>
            )
          ) : null}
          {canView ? (
            <Link
              href="/dashboard/billing"
              className={cn(
                buttonVariants({
                  variant: subscribeLink ? "outline" : "default",
                  size: "sm",
                }),
                "min-h-10",
              )}
            >
              {canManage && (showPastDue || showExpired)
                ? "Billing & subscribe"
                : "View billing"}
            </Link>
          ) : showExpired || showPastDue ? (
            <span className="text-xs text-muted-foreground sm:self-center">
              Contact your owner to update billing.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
