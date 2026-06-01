import Link from "next/link";
import type { AppRole } from "@/lib/auth/roles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InspectBillingBlockProps = {
  message: string;
  role: AppRole;
  checkoutUrl: string | null;
};

export function InspectBillingBlock({
  message,
  role,
  checkoutUrl,
}: InspectBillingBlockProps) {
  const isOwner = role === "owner";

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-5 text-center">
      <p className="text-base font-semibold text-amber-100">
        {isOwner ? "Subscribe to finish inspections" : "Account access paused"}
      </p>
      <p className="mt-2 text-sm text-amber-200/90">{message}</p>
      <div className="mt-4 flex flex-col gap-2">
        {isOwner ? (
          <>
            {checkoutUrl ? (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants(),
                  "min-h-12 w-full bg-amber-500 text-slate-950 hover:bg-amber-400",
                )}
              >
                Subscribe with Paddle
              </a>
            ) : null}
            <Link
              href="/dashboard/billing"
              className={cn(
                buttonVariants({ variant: checkoutUrl ? "outline" : "default" }),
                "min-h-12 w-full border-amber-500/40 text-amber-50",
              )}
            >
              {checkoutUrl ? "View billing options" : "Open billing"}
            </Link>
          </>
        ) : (
          <p className="text-sm text-amber-200/80">
            Ask your company owner to subscribe or renew billing.
          </p>
        )}
        <Link
          href="/dashboard/my-jobs"
          className="text-sm font-medium text-amber-400/90 underline-offset-2 hover:underline"
        >
          Back to my jobs
        </Link>
      </div>
    </div>
  );
}
