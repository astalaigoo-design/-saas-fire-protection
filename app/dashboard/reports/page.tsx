import { redirect } from "next/navigation";
import { DownloadReportButton } from "@/components/inspect/download-report-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuoteLineItemsEditor } from "@/components/quotes/quote-line-items-editor";
import {
  markQuoteAccepted,
  markQuoteDeclined,
  sendDraftQuote,
} from "@/lib/quotes/actions";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import {
  listCompanyQuotes,
  listCompanyReports,
} from "@/lib/dashboard/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function ReportsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const [quotes, reports] = await Promise.all([
    listCompanyQuotes(session.companyId),
    listCompanyReports(session.companyId),
  ]);
  const draftQuotes = quotes.filter((quote) => quote.status === "draft");
  const sentQuotes = quotes.filter((quote) => quote.status === "sent");
  const closedQuotes = quotes.filter(
    (quote) => quote.status === "accepted" || quote.status === "declined",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Compliance reports and draft repair quotes from completed inspections."
      />

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
                    <form action={sendDraftQuote} className="mt-3">
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Send quote to customer
                      </button>
                    </form>
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
            {sentQuotes.map((quote) => (
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
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Closed quotes
        </h2>
        {closedQuotes.length === 0 ? (
          <EmptyState
            title="No closed quotes"
            description="Accepted and declined quotes will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {closedQuotes.map((quote) => (
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
                    <p className="mt-2 text-xs capitalize text-muted-foreground">
                      {quote.status}
                      {quote.acceptedAt ? ` · ${formatDate(quote.acceptedAt)}` : ""}
                      {quote.declinedAt ? ` · ${formatDate(quote.declinedAt)}` : ""}
                    </p>
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
                    </p>
                    <div className="mt-3">
                      <DownloadReportButton
                        inspectionId={report.inspection.id}
                        variant="dashboard"
                      />
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
