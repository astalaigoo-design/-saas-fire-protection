import Link from "next/link";
import { QuotePipelineKpis } from "@/components/quotes/quote-pipeline-kpis";
import { QuotesStageNav } from "@/components/quotes/quotes-stage-nav";
import { RepairQuotesScopeNotice } from "@/components/quotes/repair-quotes-scope-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatQuoteCurrency } from "@/lib/quotes/format";
import type { QuotePipelineMetrics } from "@/lib/quotes/pipeline";
import type { PendingQuoteRow } from "@/lib/operations/queries";
import { cn } from "@/lib/utils";

type CommandCenterQuotesTabProps = {
  metrics: QuotePipelineMetrics;
  pendingQuotes: PendingQuoteRow[];
};

export function CommandCenterQuotesTab({
  metrics,
  pendingQuotes,
}: CommandCenterQuotesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Repair revenue pipeline — open pipeline is draft + sent totals. Win rate is accepted
          vs declined among closed quotes.
        </p>
        <Link href="/dashboard/quotes" className={cn(buttonVariants(), "min-h-10 shrink-0")}>
          Open quotes
        </Link>
      </div>

      <RepairQuotesScopeNotice variant="inline" />

      <QuotePipelineKpis metrics={metrics} />

      <QuotesStageNav activeStage="draft" counts={metrics.counts} />

      <section className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Drafts needing review
        </h3>
        {pendingQuotes.length === 0 ? (
          <EmptyState
            title="No draft quotes"
            description="Failed inspections create draft quotes automatically."
          />
        ) : (
          <ul className="space-y-3">
            {pendingQuotes.map((quote) => (
              <li
                key={quote.id}
                className="rounded-xl border border-border bg-card px-4 py-3"
              >
                <p className="font-medium text-foreground">
                  {quote.title ?? "Repair quote"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {quote.buildingLabel} · {quote.customerName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {quote.lineItemCount} line item
                  {quote.lineItemCount === 1 ? "" : "s"} ·{" "}
                  {formatQuoteCurrency(quote.totalCents, quote.currency)}
                </p>
                <Link
                  href="/dashboard/quotes?stage=draft"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 inline-flex")}
                >
                  Review & send
                </Link>
              </li>
            ))}
          </ul>
        )}
        {metrics.counts.awaiting > 0 ? (
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/quotes?stage=awaiting" className="text-primary hover:underline">
              {metrics.counts.awaiting} awaiting customer response
            </Link>
            {metrics.counts.awaitingChanges > 0
              ? ` (${metrics.counts.awaitingChanges} with change requests)`
              : ""}
          </p>
        ) : null}
        {metrics.counts.acceptedNeedsSchedule > 0 ? (
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/quotes?stage=accepted" className="text-primary hover:underline">
              {metrics.counts.acceptedNeedsSchedule} accepted — schedule job
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
