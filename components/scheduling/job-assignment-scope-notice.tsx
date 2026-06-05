import {
  JOB_ASSIGNMENT_CAPABILITIES,
  JOB_ASSIGNMENT_NOT_INCLUDED,
  JOB_ASSIGNMENT_STRATEGY,
} from "@/lib/scheduling/assignment-scope";
import { cn } from "@/lib/utils";

type JobAssignmentScopeNoticeProps = {
  variant?: "inline" | "full";
  className?: string;
};

export function JobAssignmentScopeNotice({
  variant = "inline",
  className,
}: JobAssignmentScopeNoticeProps) {
  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">One technician per visit.</span>{" "}
        Assign, reschedule, and alerts target a single tech — not multi-person crews on one job.
        Need two techs on site? Schedule two visits or leave notes on the job.
      </p>
    );
  }

  return (
    <section
      className={cn(
        "max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-labelledby="job-assignment-scope-heading"
    >
      <div>
        <h2
          id="job-assignment-scope-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Job assignment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{JOB_ASSIGNMENT_STRATEGY}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {JOB_ASSIGNMENT_CAPABILITIES.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Not included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {JOB_ASSIGNMENT_NOT_INCLUDED.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
