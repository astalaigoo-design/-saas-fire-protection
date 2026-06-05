import Link from "next/link";
import type { PilotReadinessStatus } from "@/lib/pilot-readiness/status";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PilotReadinessBannerProps = {
  status: PilotReadinessStatus;
};

export function PilotReadinessBanner({ status }: PilotReadinessBannerProps) {
  if (status.ready) return null;

  const missing = status.items.filter((item) => item.required && !item.configured);

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-foreground"
    >
      <p className="font-medium">
        Pilot readiness — {status.requiredComplete} of {status.requiredTotal} required items
        configured
      </p>
      <p className="mt-1 text-muted-foreground">
        Before go-live, finish server setup on Vercel Production:{" "}
        {missing.map((item) => item.label).join(", ")}. Customer email, field photos, scheduled
        crons, and repair workflows depend on these.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/dashboard/settings#pilot-readiness"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
        >
          Open setup checklist
        </Link>
        <Link
          href="/dashboard/operations?tab=overview"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-9")}
        >
          Command center
        </Link>
      </div>
    </div>
  );
}
