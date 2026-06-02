import { redirect } from "next/navigation";
import { DownloadReportButton } from "@/components/inspect/download-report-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuoteLineItemsEditor } from "@/components/quotes/quote-line-items-editor";
import { QuoteSendPanel } from "@/components/quotes/quote-send-panel";
import { QuoteShareLink } from "@/components/quotes/quote-share-link";
import { ScheduleJobFromQuotePanel } from "@/components/quotes/schedule-job-from-quote-panel";
import { QuoteStatus } from "@prisma/client";
import { ReportShareLink } from "@/components/reports/report-share-link";
import {
  markQuoteAccepted,
  markQuoteDeclined,
} from "@/lib/quotes/actions";
import { extractLatestCustomerQuoteNote } from "@/lib/quotes/customer-response-notes";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import {
  listCompanyQuotesSafe,
  listCompanyReportsSafe,
} from "@/lib/dashboard/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

function safeDecodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

type ReportsPageProps = {
  searchParams?: { quote?: string; error?: string };
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const scheduleError = searchParams?.error?.trim();
  const highlightQuoteId = searchParams?.quote?.trim();

  const [{ quotes, schemaReady }, reports] = await Promise.all([
    listCompanyQuotesSafe(session.companyId),
    listCompanyReportsSafe(session.companyId),
  ]);
  const draftQuotes = quotes.filter((quote) => quote.status === "draft");
  const sentQuotes = quotes.filter((quote) => quote.status === "sent");
  const acceptedQuotes = quotes.filter((quote) => quote.status === QuoteStatus.accepted);
  const declinedQuotes = quotes.filter((quote) => quote.status === QuoteStatus.declined);

  return (
    <div className="space-y-6">
      {scheduleError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Could not schedule follow-up:{" "}
          {scheduleError === "permission"
            ? "You do not have permission to schedule jobs."
            : scheduleError === "billing"
              ? "Active billing is required to schedule jobs."
              : safeDecodeParam(scheduleError)}
        </p>
      ) : null}
      <PageHeader
        title="Reports"
        description="Compliance reports and draft repair quotes from completed inspections."
      />

      {!schemaReady ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          Repair quotes are temporarily unavailable while the database finishes updating. Compliance
          report downloads below should still work.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Draft repair quotes
        </h2>
        {draftQuotes.length === 0 ? (
          <EmptyState
            title="No draft quotes yet"
            description="When inspections are submitted with failed items, draft quotes are created automatically."
          />
        ) : (
          <ul className="space-y-3">
            {draftQuotes.map((quote) => (
              <li key={quote.id}>
                <Card>
                  <CardContent>
                    <p className="font-medium text-foreground">
                      {quote.title ?? `${quote.inspection.inspectionType.name} repair quote`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {buildingLabel(quote.inspection.building)} ·{" "}
                      {quote.inspection.building.customer.name}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {quote.lineItems.length} repair item
                      {quote.lineItems.length === 1 ? "" : "s"} ·{" "}
                      {formatCurrency(quote.totalCents, quote.currency)} · Draft
                      {quote.inspection.completedAt
                        ? ` · from ${formatDate(quote.inspection.completedAt)} inspection`
                        : ""}
                    </p>
                    <QuoteLineItemsEditor
                      quoteId={quote.id}
                      currency={quote.currency}
                      subtotalCents={quote.subtotalCents}
                      taxRateBasisPoints={quote.taxRateBasisPoints}
                      taxCents={quote.taxCents}
                      discountCents={quote.discountCents}
                      totalCents={quote.totalCents}
                      lineItems={quote.lineItems}
                    />
                    <QuoteSendPanel
                      quoteId={quote.id}
                      customerEmail={quote.inspection.building.customer.email}
                      totalLabel={formatCurrency(quote.totalCents, quote.currency)}
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Sent quotes
        </h2>
        {sentQuotes.length === 0 ? (
          <EmptyState
            title="No sent quotes"
            description="After you send a quote, it appears here until accepted or declined."
          />
        ) : (
          <ul className="space-y-3">
            {sentQuotes.map((quote) => {
              const customerChangeRequest = extractLatestCustomerQuoteNote(quote.notes);
              return (
              <li key={quote.id}>
                <Card>
                  <CardContent>
                    <p className="font-medium text-foreground">
                      {quote.title ?? `${quote.inspection.inspectionType.name} repair quote`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {buildingLabel(quote.inspection.building)} ·{" "}
                      {quote.inspection.building.customer.name}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Total {formatCurrency(quote.totalCents, quote.currency)}
                      {quote.sentTo ? ` · sent to ${quote.sentTo}` : ""}
                      {quote.sentAt ? ` · ${formatDate(quote.sentAt)}` : ""}
                    </p>
                    <div className="mt-3">
                      <QuoteShareLink quoteId={quote.id} shareToken={quote.shareToken} />
                    </div>
                    {customerChangeRequest ? (
                      <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                        <span className="font-medium">Customer requested changes: </span>
                        {customerChangeRequest}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={markQuoteAccepted}>
                        <input type="hidden" name="quoteId" value={quote.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                        >
                          Mark accepted
                        </button>
                      </form>
                      <form action={markQuoteDeclined}>
                        <input type="hidden" name="quoteId" value={quote.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                        >
                          Mark declined
                        </button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Accepted quotes
        </h2>
        {acceptedQuotes.length === 0 ? (
          <EmptyState
            title="No accepted quotes"
            description="When a customer accepts a repair quote, schedule the repair or re-inspection here."
          />
        ) : (
          <ul className="space-y-3">
            {acceptedQuotes.map((quote) => (
              <li
                key={quote.id}
                id={highlightQuoteId === quote.id ? "accepted-quote" : undefined}
              >
                <Card>
                  <CardContent>
                    <p className="font-medium text-foreground">
                      {quote.title ?? `${quote.inspection.inspectionType.name} repair quote`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {buildingLabel(quote.inspection.building)} ·{" "}
                      {quote.inspection.building.customer.name}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Accepted
                      {quote.acceptedAt ? ` · ${formatDate(quote.acceptedAt)}` : ""}
                      {" · "}
                      {formatCurrency(quote.totalCents, quote.currency)}
                    </p>
                    <div className="mt-3">
                      <QuoteShareLink quoteId={quote.id} shareToken={quote.shareToken} />
                    </div>
                    <ScheduleJobFromQuotePanel
                      quoteId={quote.id}
                      scheduledInspectionId={quote.scheduledInspectionId}
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Declined quotes
        </h2>
        {declinedQuotes.length === 0 ? (
          <EmptyState
            title="No declined quotes"
            description="Declined quotes are kept here for your records."
          />
        ) : (
          <ul className="space-y-3">
            {declinedQuotes.map((quote) => (
              <li key={quote.id}>
                <Card>
                  <CardContent>
                    <p className="font-medium text-foreground">
                      {quote.title ?? `${quote.inspection.inspectionType.name} repair quote`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {buildingLabel(quote.inspection.building)} ·{" "}
                      {quote.inspection.building.customer.name}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Declined
                      {quote.declinedAt ? ` · ${formatDate(quote.declinedAt)}` : ""}
                    </p>
                    <div className="mt-3">
                      <QuoteShareLink quoteId={quote.id} shareToken={quote.shareToken} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Generate a report from a completed inspection on a building page."
        />
      ) : (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Compliance reports
          </h2>
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id}>
                <Card>
                  <CardContent>
                    <p className="font-medium text-foreground">
                      {report.title ??
                        `${report.inspection.inspectionType.name} report`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {buildingLabel(report.inspection.building)} ·{" "}
                      {report.inspection.building.customer.name}
                    </p>
                    <p className="mt-2 text-xs capitalize text-muted-foreground">
                      {report.status.replace(/_/g, " ")}
                      {report.generatedAt
                        ? ` · ${formatDate(report.generatedAt)}`
                        : ""}
                      {report.emailedTo ? ` · emailed to ${report.emailedTo}` : ""}
                    </p>
                    <div className="mt-3 space-y-3">
                      <DownloadReportButton
                        inspectionId={report.inspection.id}
                        variant="dashboard"
                      />
                      <ReportShareLink reportId={report.id} shareToken={report.shareToken} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
