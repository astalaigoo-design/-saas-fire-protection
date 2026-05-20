import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuoteLineItemsEditor } from "@/components/quotes/quote-line-items-editor";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import {
  listCompanyDraftQuotes,
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
    listCompanyDraftQuotes(session.companyId),
    listCompanyReports(session.companyId),
  ]);

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
        {quotes.length === 0 ? (
          <EmptyState
            title="No draft quotes yet"
            description="When inspections are submitted with failed items, draft quotes are created automatically."
          />
        ) : (
          <ul className="space-y-3">
            {quotes.map((quote) => (
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
                      lineItems={quote.lineItems}
                    />
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
