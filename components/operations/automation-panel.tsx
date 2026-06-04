import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  formatAutomationRunSummary,
  formatRecentDueReminderLine,
  type AutomationVisibility,
} from "@/lib/operations/automation-visibility";
import { formatDate } from "@/lib/dashboard/dates";
import { cn } from "@/lib/utils";

type AutomationPanelProps = {
  automation: AutomationVisibility;
};

export function AutomationPanel({ automation }: AutomationPanelProps) {
  return (
    <section aria-labelledby="automation-heading" className="space-y-3">
      <div>
        <h2 id="automation-heading" className="font-heading text-lg font-semibold text-foreground">
          Automated reminders
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily cron emails inspections due in {automation.leadDays} days across all branches to
          your report email and every owner/admin address. Trial-ending notices run on a separate
          schedule.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Email automation status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Due reminders sent (30 days)
              </dt>
              <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
                {automation.dueRemindersSentCount}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">
                {formatAutomationRunSummary(
                  automation.lastDueRemindersRunAt,
                  automation.lastDueRemindersRunSent,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trial ending reminders (60 days)
              </dt>
              <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
                {automation.trialRemindersSentCount}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">
                {formatAutomationRunSummary(
                  automation.lastTrialRemindersRunAt,
                  automation.lastTrialRemindersRunSent,
                )}
              </dd>
            </div>
          </dl>

          {automation.lastDueReminderSentAt ? (
            <p className="text-sm text-muted-foreground">
              Last due reminder sent{" "}
              <span className="font-medium text-foreground">
                {formatDate(automation.lastDueReminderSentAt)}
              </span>
              .
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No due-date reminders sent yet — they appear when a building is due in{" "}
              {automation.leadDays} days.
            </p>
          )}

          {automation.recentDueReminders.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent due reminders
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {automation.recentDueReminders.map((reminder) => (
                  <li key={reminder.id} className="rounded-lg bg-muted/30 px-3 py-2">
                    {formatRecentDueReminderLine(reminder)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            href="/dashboard/operations?action=inspection.due_reminder_sent"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
          >
            View all in activity log
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
