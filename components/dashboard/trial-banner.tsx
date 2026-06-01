import type { CompanyBillingSnapshot } from "@/lib/billing/queries";
import { SubscriptionStatus } from "@prisma/client";
import Link from "next/link";
import type { AppRole } from "@/lib/auth/roles";
import { isOwner } from "@/lib/auth/permissions";
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
  const owner = isOwner(role);

  if (!showTrial && !showPastDue && !showExpired) return null;

  const urgent = showPastDue || showExpired;

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border px-4 py-3 text-sm",
        urgent
          ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          : "border-primary/30 bg-primary/5 text-foreground",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{billing.message}</p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {owner && billing.checkoutUrl && (showTrial || showExpired) ? (
            <a
              href={billing.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
            >
              {showExpired ? "Subscribe now" : "Subscribe before trial ends"}
            </a>
          ) : null}
          {owner ? (
            <Link
              href="/dashboard/billing"
              className={cn(
                buttonVariants({
                  variant: owner && billing.checkoutUrl && (showTrial || showExpired) ? "outline" : "default",
                  size: "sm",
                }),
                "min-h-10",
              )}
            >
              {showPastDue || showExpired ? "Billing & subscribe" : "View billing"}
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
