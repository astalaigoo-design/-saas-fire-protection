"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubscriptionGateBilling = {
  hasAccess: boolean;
  message: string;
  checkoutUrl: string | null;
};

type SubscriptionGateProps = {
  billing: SubscriptionGateBilling;
  role: AppRole;
  children: React.ReactNode;
};

export function SubscriptionGate({ billing, role, children }: SubscriptionGateProps) {
  const pathname = usePathname();
  const onBillingPage = pathname.startsWith("/dashboard/billing");

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
            {role === "owner" ? "Subscribe to continue" : "Account access paused"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{billing.message}</p>
          {role === "owner" ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/billing" className={cn(buttonVariants(), "min-h-11")}>
                View billing
              </Link>
              {billing.checkoutUrl ? (
                <a
                  href={billing.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "min-h-11 inline-flex")}
                >
                  Subscribe with Paddle
                </a>
              ) : null}
            </div>
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
