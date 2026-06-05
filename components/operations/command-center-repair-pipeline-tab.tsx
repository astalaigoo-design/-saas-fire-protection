import Link from "next/link";
import { RepairPipelineCard } from "@/components/operations/repair-pipeline-card";
import { RepairQuotesScopeNotice } from "@/components/quotes/repair-quotes-scope-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { RepairPipelineSnapshot } from "@/lib/operations/repair-pipeline";
import { cn } from "@/lib/utils";

type CommandCenterRepairPipelineTabProps = {
  pipeline: RepairPipelineSnapshot;
};

function PipelineStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function CommandCenterRepairPipelineTab({
  pipeline,
}: CommandCenterRepairPipelineTabProps) {
  const activeRows = pipeline.rows.filter((row) => !row.isClosed);
  const closedRows = pipeline.rows.filter((row) => row.isClosed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Repair pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One chain per failed checklist line: deficiency → quote → work order → equipment register
            updated on a passing re-inspection. No need to jump across Customers, Quotes, and Work
            orders to see where each repair stands.
          </p>
        </div>
        <Link href="/dashboard/quotes" className={cn(buttonVariants(), "min-h-10 shrink-0")}>
          Open quotes
        </Link>
      </div>

      <RepairQuotesScopeNotice variant="inline" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <PipelineStat label="Active repairs" value={pipeline.totals.active} />
        <PipelineStat label="Needs quote" value={pipeline.totals.awaitingQuote} />
        <PipelineStat label="Quote in flight" value={pipeline.totals.quoteInFlight} />
        <PipelineStat label="Open work orders" value={pipeline.totals.workOrderOpen} />
        <PipelineStat
          label="Awaiting verification"
          value={pipeline.totals.awaitingVerification}
        />
      </div>

      {activeRows.length === 0 ? (
        <EmptyState
          title="No open repair chains"
          description="Failed checklist items appear here with quote and work-order status. Recently verified repairs from the last 30 days show below when present."
        />
      ) : (
        <section className="space-y-4" aria-label="Active repair pipeline">
          <h3 className="text-sm font-medium text-foreground">In progress ({activeRows.length})</h3>
          <ul className="space-y-4">
            {activeRows.map((row) => (
              <li key={row.deficiencyId}>
                <RepairPipelineCard row={row} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {closedRows.length > 0 ? (
        <section className="space-y-4" aria-label="Recently verified repairs">
          <h3 className="text-sm font-medium text-muted-foreground">
            Verified recently ({closedRows.length})
          </h3>
          <ul className="space-y-4">
            {closedRows.map((row) => (
              <li key={row.deficiencyId}>
                <RepairPipelineCard row={row} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
