"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { dashboardScheduleReinspectionFromQuoteUrl } from "@/lib/quotes/dashboard-quote-urls";
import {
  REINSPECTION_DAYS,
  REPAIR_VISIT_DAYS,
} from "@/lib/scheduling/schedule-from-accepted-quote";
import {
  scheduleJobFromQuoteAction,
  type ScheduleJobFromQuoteState,
} from "@/lib/quotes/schedule-job-from-quote-action";
import { cn } from "@/lib/utils";

type ScheduleJobFromQuotePanelProps = {
  quoteId: string;
  scheduledInspectionId: string | null;
};

export function ScheduleJobFromQuotePanel({
  quoteId,
  scheduledInspectionId,
}: ScheduleJobFromQuotePanelProps) {
  const [state, formAction] = useFormState<ScheduleJobFromQuoteState, FormData>(
    scheduleJobFromQuoteAction,
    null,
  );

  if (scheduledInspectionId) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          Job scheduled from this quote
        </p>
        <Link
          href="/dashboard/jobs"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}
        >
          Open calendar
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
      <p className="text-sm font-medium text-foreground">Schedule follow-up</p>
      <p className="text-xs text-muted-foreground">
        Re-inspection uses the same building, inspection type, and technician as the original
        visit ({REINSPECTION_DAYS} days out).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={dashboardScheduleReinspectionFromQuoteUrl(quoteId)}
          className={cn(buttonVariants(), "min-h-10 justify-center sm:flex-none")}
        >
          Schedule re-inspection ({REINSPECTION_DAYS} days)
        </Link>
        <form action={formAction} className="inline">
          <input type="hidden" name="quoteId" value={quoteId} />
          <button
            type="submit"
            name="visitKind"
            value="repair"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-10 w-full sm:w-auto",
            )}
          >
            Repair visit instead ({REPAIR_VISIT_DAYS} days)
          </button>
        </form>
      </div>
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
