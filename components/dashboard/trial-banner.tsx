import type { CompanyBillingSnapshot } from "@/lib/billing/queries";
import { SubscriptionStatus } from "@prisma/client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TrialBannerProps = {
  billing: CompanyBillingSnapshot;
};

export function TrialBanner({ billing }: TrialBannerProps) {
  if (!billing.hasAccess) return null;

  const showTrial =
    billing.subscriptionStatus === SubscriptionStatus.trialing &&
    billing.daysLeftInTrial != null;
  const showPastDue = billing.subscriptionStatus === SubscriptionStatus.past_due;

  if (!showTrial && !showPastDue) return null;

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border px-4 py-3 text-sm",
        showPastDue
          ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          : "border-primary/30 bg-primary/5 text-foreground",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{billing.message}</p>
        <Link
          href="/dashboard/billing"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
        >
          {showPastDue ? "Update billing" : "View billing"}
        </Link>
      </div>
    </div>
  );
}
