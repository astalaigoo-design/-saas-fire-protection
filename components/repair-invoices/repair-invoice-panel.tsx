"use client";

import { RepairInvoiceStatus } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/dashboard/dates";
import { formatQuoteCurrency } from "@/lib/quotes/format";
import {
  createRepairInvoiceFromQuote,
  markRepairInvoicePaid,
  sendRepairInvoice,
  type MarkRepairInvoicePaidResult,
  type RepairInvoiceActionResult,
  type SendRepairInvoiceActionResult,
} from "@/lib/repair-invoices/actions";
import { cn } from "@/lib/utils";

type RepairInvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: RepairInvoiceStatus;
  totalCents: number;
  currency: string;
  sentTo: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  dueAt: Date | null;
};

type RepairInvoicePanelProps = {
  quoteId: string;
  customerEmail: string | null;
  totalLabel: string;
  totalCents: number;
  currency: string;
  repairInvoice: RepairInvoiceSummary | null;
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

function CreateInvoiceButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        buttonVariants({ size: "default" }),
        "min-h-10 bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-60",
      )}
    >
      {pending ? "Creating…" : "Create invoice"}
    </button>
  );
}

function SendInvoiceButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        buttonVariants({ size: "default" }),
        "min-h-10 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60",
      )}
    >
      {pending ? "Sending…" : "Email invoice"}
    </button>
  );
}

function MarkPaidButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        buttonVariants({ variant: "outline", size: "default" }),
        "min-h-10",
      )}
    >
      {pending ? "Saving…" : "Mark paid"}
    </button>
  );
}

export function RepairInvoicePanel({
  quoteId,
  customerEmail,
  totalLabel,
  totalCents,
  currency,
  repairInvoice,
}: RepairInvoicePanelProps) {
  const [createState, createAction] = useFormState(
    createRepairInvoiceFromQuote,
    null as RepairInvoiceActionResult | null,
  );
  const [sendState, sendAction] = useFormState(
    sendRepairInvoice,
    null as SendRepairInvoiceActionResult | null,
  );
  const [paidState, paidAction] = useFormState(
    markRepairInvoicePaid,
    null as MarkRepairInvoicePaidResult | null,
  );

  const invoice =
    repairInvoice ??
    (createState?.ok
      ? {
          id: createState.invoiceId,
          invoiceNumber: createState.invoiceNumber,
          status: RepairInvoiceStatus.draft,
          totalCents,
          currency,
          sentTo: null,
          sentAt: null,
          paidAt: null,
          dueAt: null,
        }
      : null);

  if (!invoice) {
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Repair invoice</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a formal invoice ({totalLabel}) from this accepted quote. Separate from your
            Flareflow subscription — send PDF to the customer and track payment here.
          </p>
        </div>
        {createState && !createState.ok ? (
          <p role="alert" className="text-sm text-destructive">
            {createState.error}
          </p>
        ) : null}
        <form action={createAction}>
          <input type="hidden" name="quoteId" value={quoteId} />
          <CreateInvoiceButton />
        </form>
      </div>
    );
  }

  const previewUrl = `/api/repair-invoices/${invoice.id}/pdf`;
  const isPaid = invoice.status === RepairInvoiceStatus.paid;

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Repair invoice · {invoice.invoiceNumber}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {statusLabel(invoice.status)}
          {invoice.dueAt && !isPaid ? ` · Due ${formatDate(invoice.dueAt)}` : ""}
          {invoice.sentTo ? ` · Sent to ${invoice.sentTo}` : ""}
          {invoice.sentAt ? ` · ${formatDate(invoice.sentAt)}` : ""}
          {invoice.paidAt ? ` · Paid ${formatDate(invoice.paidAt)}` : ""}
          {invoice.totalCents > 0
            ? ` · ${formatQuoteCurrency(invoice.totalCents, invoice.currency)}`
            : totalLabel
              ? ` · ${totalLabel}`
              : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
        >
          Preview invoice PDF
        </a>
      </div>

      {sendState?.ok ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          Invoice {sendState.invoiceNumber} emailed to {sendState.sentTo}.
        </p>
      ) : null}

      {paidState?.ok ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          Invoice marked paid.
        </p>
      ) : null}

      {!isPaid ? (
        <>
          {customerEmail ? (
            <p className="text-sm text-muted-foreground">
              Sends to <span className="font-medium text-foreground">{customerEmail}</span>
            </p>
          ) : (
            <p role="alert" className="text-sm text-destructive">
              Add a customer email on the customer profile before sending.
            </p>
          )}

          {sendState && !sendState.ok ? (
            <p role="alert" className="text-sm text-destructive">
              {sendState.error}
            </p>
          ) : null}

          {paidState && !paidState.ok ? (
            <p role="alert" className="text-sm text-destructive">
              {paidState.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <form action={sendAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <SendInvoiceButton />
            </form>
            <form action={paidAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <MarkPaidButton />
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
