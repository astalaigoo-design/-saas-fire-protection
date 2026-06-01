"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
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
      <p className="text-sm font-medium text-foreground">Schedule from quote</p>
      <p className="text-xs text-muted-foreground">
        One click creates a job on the calendar with the same building, inspection type, and
        technician as the original visit.
      </p>
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input type="hidden" name="quoteId" value={quoteId} />
        <button
          type="submit"
          name="visitKind"
          value="repair"
          className={cn(
            buttonVariants(),
            "min-h-10 flex-1 sm:flex-none",
          )}
        >
          Schedule repair visit ({REPAIR_VISIT_DAYS} days)
        </button>
        <button
          type="submit"
          name="visitKind"
          value="reinspection"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "min-h-10 flex-1 sm:flex-none",
          )}
        >
          Schedule re-inspection ({REINSPECTION_DAYS} days)
        </button>
      </form>
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
