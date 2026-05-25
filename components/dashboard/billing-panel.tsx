import Link from "next/link";
import type { CompanyBillingSnapshot } from "@/lib/billing/queries";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { SubscriptionStatus } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPanelProps = {
  billing: CompanyBillingSnapshot;
  isOwner: boolean;
};

function statusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case SubscriptionStatus.trialing:
      return "Free trial";
    case SubscriptionStatus.active:
      return "Active subscription";
    case SubscriptionStatus.past_due:
      return "Past due";
    case SubscriptionStatus.cancelled:
      return "Cancelled";
    case SubscriptionStatus.expired:
      return "Expired";
    default:
      return "Unknown";
  }
}

export function BillingPanel({ billing, isOwner }: BillingPanelProps) {
  const renewsLabel = billing.subscriptionRenewsAt
    ? billing.subscriptionRenewsAt.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-lg space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Current plan
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">
          {statusLabel(billing.subscriptionStatus)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{billing.message}</p>

        {billing.subscriptionStatus === SubscriptionStatus.trialing && billing.trialEndsAt ? (
          <p className="mt-3 text-sm text-foreground">
            Trial ends{" "}
            <span className="font-medium">
              {billing.trialEndsAt.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {billing.daysLeftInTrial != null ? (
              <> ({billing.daysLeftInTrial} day{billing.daysLeftInTrial === 1 ? "" : "s"} left)</>
            ) : null}
          </p>
        ) : null}

        {renewsLabel &&
        (billing.subscriptionStatus === SubscriptionStatus.active ||
          billing.subscriptionStatus === SubscriptionStatus.cancelled) ? (
          <p className="mt-3 text-sm text-foreground">
            {billing.subscriptionStatus === SubscriptionStatus.cancelled
              ? "Access until"
              : "Renews on"}{" "}
            <span className="font-medium">{renewsLabel}</span>
          </p>
        ) : null}
      </section>

      {isOwner ? (
        <section className="space-y-3 rounded-xl border border-border p-5">
          <h3 className="text-sm font-medium text-foreground">Subscribe with Paddle</h3>
          <p className="text-sm text-muted-foreground">
            New companies get a {TRIAL_DAYS}-day free trial. After checkout, your subscription
            activates automatically via webhook.
          </p>
          {billing.checkoutUrl ? (
            <a
              href={billing.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants(), "min-h-11 inline-flex w-full sm:w-auto")}
            >
              Open checkout
            </a>
          ) : (
            <p role="alert" className="text-sm text-destructive">
              Checkout URL is not configured. Set NEXT_PUBLIC_PADDLE_CHECKOUT_URL in your
              environment.
            </p>
          )}
          {billing.customerPortalUrl ? (
            <Link
              href={billing.customerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11 inline-flex")}
            >
              Manage subscription
            </Link>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the company owner can manage billing and subscriptions.
        </p>
      )}
    </div>
  );
}
