import { StatCard } from "@/components/dashboard/stat-card";
import { formatQuoteCurrency } from "@/lib/quotes/format";
import type { QuotePipelineMetrics } from "@/lib/quotes/pipeline";

type QuotePipelineKpisProps = {
  metrics: QuotePipelineMetrics;
  currency?: string;
};

export function QuotePipelineKpis({ metrics, currency = "USD" }: QuotePipelineKpisProps) {
  return (
    <section aria-labelledby="quote-kpis-heading" className="space-y-3">
      <h2 id="quote-kpis-heading" className="sr-only">
        Quote pipeline metrics
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={0}
          displayValue={formatQuoteCurrency(metrics.openPipelineCents, currency)}
          hint={`${metrics.counts.draft} draft · ${metrics.counts.awaiting} awaiting`}
        />
        <StatCard
          label="Awaiting response"
          value={metrics.counts.awaiting}
          hint={
            metrics.counts.awaitingChanges > 0
              ? `${metrics.counts.awaitingChanges} requested changes`
              : "Sent to customer"
          }
        />
        <StatCard
          label="Accepted · schedule job"
          value={metrics.counts.acceptedNeedsSchedule}
          hint={`${metrics.counts.accepted} accepted total`}
        />
        <StatCard
          label="Win rate"
          value={metrics.conversionPercent ?? 0}
          displayValue={
            metrics.conversionPercent === null ? "—" : `${metrics.conversionPercent}%`
          }
          hint="Accepted vs declined (closed)"
        />
      </div>
    </section>
  );
}
