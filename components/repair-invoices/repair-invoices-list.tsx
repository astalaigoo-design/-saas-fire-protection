import Link from "next/link";
import { RepairInvoiceStatus } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import type { RepairInvoiceListItem } from "@/lib/repair-invoices/queries";
import { formatQuoteCurrency } from "@/lib/quotes/format";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RepairInvoicesListProps = {
  invoices: RepairInvoiceListItem[];
};

function statusLabel(status: RepairInvoiceStatus): string {
  switch (status) {
    case RepairInvoiceStatus.draft:
      return "Draft";
    case RepairInvoiceStatus.sent:
      return "Sent";
    case RepairInvoiceStatus.paid:
      return "Paid";
    case RepairInvoiceStatus.void:
      return "Void";
    default:
      return status;
  }
}

function invoiceTitle(invoice: RepairInvoiceListItem): string {
  return (
    invoice.quote.title ??
    `${invoice.quote.inspection.inspectionType.name} repair invoice`
  );
}

export function RepairInvoicesList({ invoices }: RepairInvoicesListProps) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No repair invoices yet"
        description="Create an invoice from an accepted repair quote on the Quotes page."
      >
        <Link href="/dashboard/quotes?stage=accepted" className={cn(buttonVariants(), "min-h-10")}>
          Accepted quotes
        </Link>
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {invoices.map((invoice) => {
        const building = invoice.quote.inspection.building;
        return (
          <li key={invoice.id}>
            <Card>
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {invoice.invoiceNumber} · {invoiceTitle(invoice)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {buildingLabel(building)} · {building.customer.name}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {statusLabel(invoice.status)}
                      {" · "}
                      {formatQuoteCurrency(invoice.totalCents, invoice.currency)}
                      {" · Issued "}
                      {formatDate(invoice.issuedAt)}
                      {invoice.dueAt ? ` · Due ${formatDate(invoice.dueAt)}` : ""}
                      {invoice.sentTo ? ` · Sent to ${invoice.sentTo}` : ""}
                      {invoice.paidAt ? ` · Paid ${formatDate(invoice.paidAt)}` : ""}
                    </p>
                  </div>
                  <a
                    href={`/api/repair-invoices/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10 shrink-0")}
                  >
                    PDF
                  </a>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
