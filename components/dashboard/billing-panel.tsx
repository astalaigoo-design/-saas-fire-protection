import Link from "next/link";
import type { CompanyBillingSnapshot } from "@/lib/billing/queries";
import { PaddleInlineCheckout } from "@/components/billing/paddle-inline-checkout";
import { PAID_CHECKOUT_ENABLED, TRIAL_DAYS } from "@/lib/billing/constants";
import { isPaddleInlineCheckoutReady } from "@/lib/billing/paddle-env";
import { SubscriptionStatus } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPanelProps = {
  billing: CompanyBillingSnapshot;
  isOwner: boolean;
  customerEmail: string | null;
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

export function BillingPanel({ billing, isOwner, customerEmail }: BillingPanelProps) {
  const inlineCheckoutReady = isPaddleInlineCheckoutReady();
  const showCheckout =
    PAID_CHECKOUT_ENABLED &&
    isOwner &&
    billing.subscriptionStatus !== SubscriptionStatus.active &&
    (inlineCheckoutReady || billing.checkoutUrl);
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

      {showCheckout ? (
        <section className="space-y-4 rounded-xl border border-border p-5">
          <div>
            <h3 className="text-sm font-medium text-foreground">Subscribe with Paddle</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New companies get a {TRIAL_DAYS}-day free trial. After payment, your subscription
              activates automatically via webhook.
            </p>
          </div>
          {inlineCheckoutReady ? (
            <PaddleInlineCheckout
              companyId={billing.companyId}
              customerEmail={customerEmail}
            />
          ) : billing.checkoutUrl ? (
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
              Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_PRICE_ID, or a hosted
              NEXT_PUBLIC_PADDLE_CHECKOUT_URL.
            </p>
          )}
        </section>
      ) : null}

      {isOwner && billing.subscriptionStatus === SubscriptionStatus.active ? (
        <section className="space-y-3 rounded-xl border border-border p-5">
          <h3 className="text-sm font-medium text-foreground">Manage subscription</h3>
          {billing.customerPortalUrl ? (
            <Link
              href={billing.customerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11 inline-flex")}
            >
              Open customer portal
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Contact support to change or cancel your plan.
            </p>
          )}
        </section>
      ) : isOwner && billing.customerPortalUrl && !showCheckout ? (
        <section className="space-y-3 rounded-xl border border-border p-5">
          <Link
            href={billing.customerPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11 inline-flex")}
          >
            Manage subscription
          </Link>
        </section>
      ) : !isOwner ? (
        <p className="text-sm text-muted-foreground">
          Only the company owner can manage billing and subscriptions.
        </p>
      ) : null}
    </div>
  );
}
