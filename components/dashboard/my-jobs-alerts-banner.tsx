import Link from "next/link";
import type { JobAssignmentAlert } from "@/lib/notifications/job-alerts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MyJobsAlertsBannerProps = {
  alerts: JobAssignmentAlert[];
};

export function MyJobsAlertsBanner({ alerts }: MyJobsAlertsBannerProps) {
  if (alerts.length === 0) return null;

  const primary = alerts[0];
  const more = alerts.length - 1;

  return (
    <div
      role="status"
      className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
    >
      <p className="font-medium text-foreground">{primary.title}</p>
      <p className="mt-1 text-muted-foreground">{primary.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {primary.href ? (
          <Link
            href={primary.href}
            className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
          >
            Open job
          </Link>
        ) : null}
        {more > 0 ? (
          <span className="text-xs text-muted-foreground">
            +{more} more unread — use the bell in the header
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        You also get email (when Resend is on) and SMS (when Twilio is on and your mobile is saved
        below).
      </p>
    </div>
  );
}
