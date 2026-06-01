import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/dashboard/dates";
import { AuditLogFeed } from "@/components/operations/audit-log-feed";
import type { AuditLogPage } from "@/lib/audit/queries";
import type { CommandCenterSnapshot } from "@/lib/operations/queries";
import type { DueInspectionRow } from "@/lib/operations/due-inspections";
import { OperationsExportButtons } from "@/components/operations/operations-export-buttons";
import { DUE_REMINDER_DAYS } from "@/lib/scheduling/recurrence-policy";
import { cn } from "@/lib/utils";

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function DueStatusBadge({ status }: { status: DueInspectionRow["status"] }) {
  const styles = {
    overdue: "bg-destructive/10 text-destructive",
    due_soon: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    never_inspected: "bg-muted text-muted-foreground",
  } as const;
  const labels = {
    overdue: "Overdue",
    due_soon: "Due soon",
    never_inspected: "Not started",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function DueInspectionList({ rows }: { rows: DueInspectionRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="All clear for this cadence"
        description="No overdue or upcoming due dates in the next two weeks."
        className="py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {rows.map((row) => (
        <li key={`${row.buildingId}-${row.inspectionTypeCode}`} className="px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/buildings/${row.buildingId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {row.buildingLabel}
                </Link>
                <DueStatusBadge status={row.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {row.customerName} · {row.inspectionTypeName}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.status === "never_inspected"
                  ? "No completed inspection on record for this cadence."
                  : row.dueAt
                    ? row.status === "overdue"
                      ? `Was due ${formatDate(row.dueAt)}`
                      : `Due ${formatDate(row.dueAt)}`
                    : null}
                {row.lastCompletedAt ? ` · Last completed ${formatDate(row.lastCompletedAt)}` : ""}
              </p>
            </div>
            <Link
              href={
                row.scheduledInspectionId
                  ? `/inspect/${row.scheduledInspectionId}`
                  : "/dashboard/jobs/new"
              }
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              {row.scheduledInspectionId ? "Open job" : "Schedule"}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

type CommandCenterViewProps = {
  snapshot: CommandCenterSnapshot;
  auditLog: AuditLogPage;
  auditFilters: { action: string; entityType: string };
};

export function CommandCenterView({ snapshot, auditLog, auditFilters }: CommandCenterViewProps) {
  const overdueTotal =
    snapshot.dueTotals.overdue + snapshot.dueTotals.neverInspected;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command center"
        description={`Compliance workload at a glance. Failed jobs auto-schedule a follow-up; recurring cadence jobs auto-schedule on submit. Due-date emails send ${DUE_REMINDER_DAYS} days ahead to your report email.`}
        actions={
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <OperationsExportButtons />
            <Link
              href="/dashboard/jobs/new"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
            >
              Schedule inspection
            </Link>
          </div>
        }
      />

      <section aria-labelledby="command-stats">
        <h2 id="command-stats" className="sr-only">
          Summary stats
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Overdue / not started" value={overdueTotal} />
          <StatCard label="Due in 14 days" value={snapshot.dueTotals.dueSoon} />
          <StatCard label="Open deficiencies" value={snapshot.summary.openDeficiencies} />
          <StatCard label="Quotes to approve" value={snapshot.summary.pendingQuotes} />
          <StatCard label="Reports sent (month)" value={snapshot.summary.reportsSentThisMonth} />
        </div>
      </section>

      <section aria-labelledby="due-heading" className="space-y-4">
        <div>
          <h2 id="due-heading" className="font-heading text-lg font-semibold text-foreground">
            Buildings due & overdue
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly, quarterly, and annual cadences based on last completed visit or open scheduled
            jobs.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {(
            [
              ["Monthly", snapshot.dueByCadence.monthly],
              ["Quarterly", snapshot.dueByCadence.quarterly],
              ["Annual", snapshot.dueByCadence.annual],
            ] as const
          ).map(([label, rows]) => (
            <Card key={label}>
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <DueInspectionList rows={rows} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="deficiencies-heading" className="space-y-3">
          <h2 id="deficiencies-heading" className="font-heading text-lg font-semibold text-foreground">
            Open deficiencies
          </h2>
          {snapshot.deficiencies.length === 0 ? (
            <EmptyState
              title="No open deficiencies"
              description="Failed checklist items from completed inspections appear here until quoted or resolved."
            />
          ) : (
            <ul className="space-y-3">
              {snapshot.deficiencies.map((item) => (
                <li key={item.id}>
                  <Card>
                    <CardContent className="space-y-2 pt-4">
                      <p className="font-medium text-foreground">{item.label}</p>
                      {item.description ? (
                        <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        <Link
                          href={`/dashboard/buildings/${item.buildingId}`}
                          className="text-primary hover:underline"
                        >
                          {item.buildingLabel}
                        </Link>
                        {" · "}
                        {item.customerName} · {item.inspectionTypeName}
                      </p>
                      {item.completedAt ? (
                        <p className="text-xs text-muted-foreground">
                          Found {formatDate(item.completedAt)}
                        </p>
                      ) : null}
                      <Link
                        href="/dashboard/reports"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        {item.quoteId ? "Review quote" : "Create quote"}
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="quotes-heading" className="space-y-3">
            <h2 id="quotes-heading" className="font-heading text-lg font-semibold text-foreground">
              Quotes pending approval
            </h2>
            {snapshot.pendingQuotes.length === 0 ? (
              <EmptyState
                title="No draft quotes"
                description="Draft repair quotes from failed inspections wait here for your review before sending."
              />
            ) : (
              <ul className="space-y-3">
                {snapshot.pendingQuotes.map((quote) => (
                  <li key={quote.id}>
                    <Card>
                      <CardContent className="space-y-2 pt-4">
                        <p className="font-medium text-foreground">
                          {quote.title ?? "Repair quote"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quote.buildingLabel} · {quote.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quote.lineItemCount} line item
                          {quote.lineItemCount === 1 ? "" : "s"} ·{" "}
                          {formatCurrency(quote.totalCents, quote.currency)} · Draft
                        </p>
                        <Link
                          href="/dashboard/reports"
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          Review & send
                        </Link>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="reports-heading" className="space-y-3">
            <h2 id="reports-heading" className="font-heading text-lg font-semibold text-foreground">
              Reports sent this month
            </h2>
            {snapshot.reportsSentThisMonth.length === 0 ? (
              <EmptyState
                title="No reports sent yet this month"
                description="Compliance PDFs emailed to customers after inspection submit appear here."
              />
            ) : (
              <ul className="space-y-3">
                {snapshot.reportsSentThisMonth.map((report) => (
                  <li key={report.id}>
                    <Card>
                      <CardContent className="space-y-2 pt-4">
                        <p className="font-medium text-foreground">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.buildingLabel} · {report.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {formatDate(report.sentAt)}
                          {report.sentTo ? ` to ${report.sentTo}` : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <AuditLogFeed
        key={`${auditFilters.action}|${auditFilters.entityType}`}
        initialEvents={auditLog.events}
        initialNextCursor={auditLog.nextCursor}
        initialAction={auditFilters.action}
        initialEntityType={auditFilters.entityType}
      />
    </div>
  );
}
