"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canManageBilling, canViewBilling } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import {
  canShowSubscribeCta,
  resolveSubscribePrimaryLink,
} from "@/lib/billing/subscribe-cta";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubscriptionGateBilling = {
  hasAccess: boolean;
  message: string;
  checkoutUrl: string | null;
  inlineCheckoutReady: boolean;
  designPartner: boolean;
};

type SubscriptionGateProps = {
  billing: SubscriptionGateBilling;
  role: AppRole;
  children: React.ReactNode;
};

export function SubscriptionGate({ billing, role, children }: SubscriptionGateProps) {
  const pathname = usePathname();
  const onBillingPage = pathname.startsWith("/dashboard/billing");
  const canManage = canManageBilling(role);
  const canView = canViewBilling(role);
  const subscribeLink = canShowSubscribeCta({
    checkoutUrl: billing.checkoutUrl,
    inlineCheckoutReady: billing.inlineCheckoutReady,
    designPartner: billing.designPartner,
    canManage,
  })
    ? resolveSubscribePrimaryLink({
        checkoutUrl: billing.checkoutUrl,
        inlineCheckoutReady: billing.inlineCheckoutReady,
        urgent: true,
      })
    : null;

  if (billing.hasAccess || onBillingPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center bg-background/70 px-4 py-16 backdrop-blur-sm">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {canManage ? "Subscribe to continue" : "Account access paused"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{billing.message}</p>
          {canManage ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {subscribeLink ? (
                subscribeLink.external ? (
                  <a
                    href={subscribeLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants(), "min-h-11 inline-flex")}
                  >
                    {subscribeLink.label}
                  </a>
                ) : (
                  <Link
                    href={subscribeLink.href}
                    className={cn(buttonVariants(), "min-h-11 inline-flex")}
                  >
                    {subscribeLink.label}
                  </Link>
                )
              ) : null}
              <Link
                href="/dashboard/billing"
                className={cn(
                  buttonVariants({ variant: subscribeLink ? "outline" : "default" }),
                  "min-h-11",
                )}
              >
                {subscribeLink ? "Billing details" : "Open billing"}
              </Link>
            </div>
          ) : canView ? (
            <Link
              href="/dashboard/billing"
              className={cn(buttonVariants(), "mt-6 min-h-11 inline-flex")}
            >
              View billing
            </Link>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Ask your company owner to subscribe or renew billing.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
