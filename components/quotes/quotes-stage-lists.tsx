import { QuoteStatus } from "@prisma/client";
import { QuoteLineItemsEditor } from "@/components/quotes/quote-line-items-editor";
import { QuoteSendPanel } from "@/components/quotes/quote-send-panel";
import { QuoteShareLink } from "@/components/quotes/quote-share-link";
import { RepairInvoicePanel } from "@/components/repair-invoices/repair-invoice-panel";
import { ScheduleJobFromQuotePanel } from "@/components/quotes/schedule-job-from-quote-panel";
import {
  markQuoteAccepted,
  markQuoteDeclined,
} from "@/lib/quotes/actions";
import { extractLatestCustomerQuoteNote } from "@/lib/quotes/customer-response-notes";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import type { QuoteListItem } from "@/lib/dashboard/queries";
import { formatQuoteCurrency } from "@/lib/quotes/format";
import type { QuotePipelineStage } from "@/lib/quotes/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type QuotesStageListsProps = {
  quotes: QuoteListItem[];
  stage: QuotePipelineStage;
  highlightQuoteId?: string;
};

function quoteTitle(quote: QuoteListItem): string {
  return quote.title ?? `${quote.inspection.inspectionType.name} repair quote`;
}

export function QuotesStageLists({
  quotes,
  stage,
  highlightQuoteId,
}: QuotesStageListsProps) {
  const draft = quotes.filter((q) => q.status === QuoteStatus.draft);
  const sent = quotes.filter((q) => q.status === QuoteStatus.sent);
  const accepted = quotes.filter((q) => q.status === QuoteStatus.accepted);
  const declined = quotes.filter((q) => q.status === QuoteStatus.declined);

  const showDraft = stage === "all" || stage === "draft";
  const showAwaiting = stage === "all" || stage === "awaiting";
  const showAccepted = stage === "all" || stage === "accepted";
  const showDeclined = stage === "all" || stage === "declined";

  if (quotes.length === 0) {
    return (
      <EmptyState
        title="No quotes in this view"
        description="Change the filter above or complete an inspection with failed items to create a draft quote."
      />
    );
  }

  return (
    <div className="space-y-8">
      {showDraft ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Draft · approve & send</h2>
          {draft.length === 0 ? (
            <p className="text-sm text-muted-foreground">No draft quotes.</p>
          ) : (
            <ul className="space-y-3">
              {draft.map((quote) => (
                <li key={quote.id}>
                  <Card>
                    <CardContent>
                      <p className="font-medium text-foreground">{quoteTitle(quote)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {buildingLabel(quote.inspection.building)} ·{" "}
                        {quote.inspection.building.customer.name}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {quote.lineItems.length} line item
                        {quote.lineItems.length === 1 ? "" : "s"} ·{" "}
                        {formatQuoteCurrency(quote.totalCents, quote.currency)} · Draft
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
                        totalLabel={formatQuoteCurrency(quote.totalCents, quote.currency)}
                      />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showAwaiting ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Awaiting customer response</h2>
          {sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotes awaiting response.</p>
          ) : (
            <ul className="space-y-3">
              {sent.map((quote) => {
                const customerChangeRequest = extractLatestCustomerQuoteNote(quote.notes);
                return (
                  <li key={quote.id}>
                    <Card>
                      <CardContent>
                        <p className="font-medium text-foreground">{quoteTitle(quote)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {buildingLabel(quote.inspection.building)} ·{" "}
                          {quote.inspection.building.customer.name}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Total {formatQuoteCurrency(quote.totalCents, quote.currency)}
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
      ) : null}

      {showAccepted ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Accepted · schedule job</h2>
          {accepted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accepted quotes.</p>
          ) : (
            <ul className="space-y-3">
              {accepted.map((quote) => (
                <li
                  key={quote.id}
                  id={highlightQuoteId === quote.id ? "accepted-quote" : undefined}
                >
                  <Card>
                    <CardContent>
                      <p className="font-medium text-foreground">{quoteTitle(quote)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {buildingLabel(quote.inspection.building)} ·{" "}
                        {quote.inspection.building.customer.name}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Accepted
                        {quote.acceptedAt ? ` · ${formatDate(quote.acceptedAt)}` : ""}
                        {" · "}
                        {formatQuoteCurrency(quote.totalCents, quote.currency)}
                        {quote.scheduledInspectionId ? " · Job scheduled" : " · Needs scheduling"}
                      </p>
                      <div className="mt-3">
                        <QuoteShareLink quoteId={quote.id} shareToken={quote.shareToken} />
                      </div>
                      <ScheduleJobFromQuotePanel
                        quoteId={quote.id}
                        scheduledInspectionId={quote.scheduledInspectionId}
                      />
                      <RepairInvoicePanel
                        quoteId={quote.id}
                        customerEmail={quote.inspection.building.customer.email}
                        totalLabel={formatQuoteCurrency(quote.totalCents, quote.currency)}
                        totalCents={quote.totalCents}
                        currency={quote.currency}
                        repairInvoice={quote.repairInvoice}
                      />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showDeclined ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Declined</h2>
          {declined.length === 0 ? (
            <p className="text-sm text-muted-foreground">No declined quotes.</p>
          ) : (
            <ul className="space-y-3">
              {declined.map((quote) => (
                <li key={quote.id}>
                  <Card>
                    <CardContent>
                      <p className="font-medium text-foreground">{quoteTitle(quote)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {buildingLabel(quote.inspection.building)} ·{" "}
                        {quote.inspection.building.customer.name}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Declined
                        {quote.declinedAt ? ` · ${formatDate(quote.declinedAt)}` : ""}
                        {" · "}
                        {formatQuoteCurrency(quote.totalCents, quote.currency)}
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
      ) : null}
    </div>
  );
}
