import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuotePipelineKpis } from "@/components/quotes/quote-pipeline-kpis";
import { QuotesStageLists } from "@/components/quotes/quotes-stage-lists";
import { QuotesStageNav } from "@/components/quotes/quotes-stage-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listCompanyQuotesSafe } from "@/lib/dashboard/queries";
import { OutboundEmailInlineNotice } from "@/components/dashboard/outbound-email-inline-notice";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getOutboundChannelsStatus } from "@/lib/outbound/channels";
import {
  computeQuotePipelineMetrics,
  filterQuotesByStage,
  isValidQuotePipelineStage,
  type QuotePipelineStage,
} from "@/lib/quotes/pipeline";

function safeDecodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

type QuotesPageProps = {
  searchParams?: { stage?: string; quote?: string; error?: string };
};

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const scheduleError = searchParams?.error?.trim();
  const highlightQuoteId = searchParams?.quote?.trim();
  const stageParam = searchParams?.stage?.trim() ?? "all";
  const stage: QuotePipelineStage = isValidQuotePipelineStage(stageParam)
    ? stageParam
    : "all";

  const { quotes, schemaReady } = await listCompanyQuotesSafe(session);
  const metrics = computeQuotePipelineMetrics(quotes);
  const filtered = filterQuotesByStage(quotes, stage);

  return (
    <div className="space-y-6">
      {scheduleError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Could not schedule job:{" "}
          {scheduleError === "permission"
            ? "You do not have permission to schedule jobs."
            : scheduleError === "billing"
              ? "Active billing is required to schedule jobs."
              : safeDecodeParam(scheduleError)}
        </p>
      ) : null}

      <PageHeader
        title="Repair quotes"
        description="Pipeline for repair revenue — draft, customer response, accepted jobs, and win rate. Compliance PDFs live under Reports."
        actions={
          <Link href="/dashboard/reports" className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}>
            Compliance reports
          </Link>
        }
      />

      <OutboundEmailInlineNotice channels={getOutboundChannelsStatus()} context="quotes" />

      {!schemaReady ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          Repair quotes are temporarily unavailable while the database finishes updating.
        </p>
      ) : (
        <>
          <QuotePipelineKpis metrics={metrics} />
          <QuotesStageNav activeStage={stage} counts={metrics.counts} />
          <QuotesStageLists
            quotes={filtered}
            stage={stage}
            highlightQuoteId={highlightQuoteId}
          />
        </>
      )}
    </div>
  );
}
