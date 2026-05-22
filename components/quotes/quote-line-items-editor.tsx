"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import {
  updateDraftQuoteLineItems,
  type QuoteLineItemsActionResult,
} from "@/lib/quotes/actions";
import { cn } from "@/lib/utils";

type EditableQuoteLineItem = {
  id: string;
  label: string;
  description: string | null;
  quantity: number;
  unitPriceCents: number;
};

type QuoteLineItemsEditorProps = {
  quoteId: string;
  currency: string;
  subtotalCents: number;
  taxRateBasisPoints: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  lineItems: EditableQuoteLineItem[];
};

type LineItemDraft = {
  id: string;
  label: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

const initialState: QuoteLineItemsActionResult = { ok: false, error: "" };

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "sm" }), "min-h-10 px-4 disabled:opacity-60")}
    >
      {pending ? "Saving..." : "Save pricing"}
    </button>
  );
}

export function QuoteLineItemsEditor({
  quoteId,
  currency,
  subtotalCents,
  taxRateBasisPoints,
  taxCents,
  discountCents,
  totalCents,
  lineItems,
}: QuoteLineItemsEditorProps) {
  const [state, formAction] = useFormState(updateDraftQuoteLineItems, initialState);
  const [draftItems, setDraftItems] = useState<LineItemDraft[]>(
    lineItems.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description ?? "",
      quantity: String(item.quantity),
      unitPrice: (item.unitPriceCents / 100).toFixed(2),
    })),
  );
  const [taxRatePercent, setTaxRatePercent] = useState<string>(
    (taxRateBasisPoints / 100).toFixed(2),
  );
  const [discountAmount, setDiscountAmount] = useState<string>(
    (discountCents / 100).toFixed(2),
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        draftItems.map((item) => ({
          id: item.id,
          label: item.label.trim(),
          description: item.description.trim(),
          quantity: Number(item.quantity || "0"),
          unitPrice: Number(item.unitPrice || "0"),
        })),
      ),
    [draftItems],
  );

  const draftTotalCents = useMemo(
    () => {
      const draftSubtotal = draftItems.reduce((sum, item) => {
        const quantity = Number(item.quantity || "0");
        const unitPrice = Number(item.unitPrice || "0");
        if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return sum;
        return sum + Math.round(unitPrice * 100) * quantity;
      }, 0);
      const draftTax = Math.round(
        (draftSubtotal * Number(taxRatePercent || "0")) / 100,
      );
      const draftDiscount = Math.round(Number(discountAmount || "0") * 100);
      return {
        subtotal: draftSubtotal,
        tax: draftTax,
        discount: Math.max(0, draftDiscount),
        total: Math.max(0, draftSubtotal + draftTax - Math.max(0, draftDiscount)),
      };
    },
    [draftItems, taxRatePercent, discountAmount],
  );

  function updateItem(id: string, patch: Partial<LineItemDraft>) {
    setDraftItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  const currencyLabel = currency.toUpperCase();

  return (
    <form action={formAction} className="mt-4 space-y-4 rounded-lg border border-border/70 p-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="lineItemsJson" value={payload} readOnly />
      <input type="hidden" name="taxRatePercent" value={taxRatePercent} readOnly />
      <input type="hidden" name="discountAmount" value={discountAmount} readOnly />

      <div>
        <h3 className="text-sm font-semibold text-foreground">Pricing</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Edit quantity, unit price, tax %, and discount.
        </p>
      </div>

      {state.ok === false && state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
          Quote pricing saved.
        </p>
      ) : null}

      <ul className="space-y-3">
        {draftItems.map((item, index) => (
          <li key={item.id} className="space-y-2 rounded-lg border border-border/60 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Line item {index + 1}
            </p>
            <Input
              value={item.label}
              onChange={(event) => updateItem(item.id, { label: event.target.value })}
              placeholder="Line item label"
              className="min-h-10"
            />
            <Textarea
              value={item.description}
              onChange={(event) => updateItem(item.id, { description: event.target.value })}
              placeholder="Repair scope / notes"
              className="min-h-16"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${item.id}-quantity`}>Quantity</Label>
                <Input
                  id={`${item.id}-quantity`}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                  className="min-h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${item.id}-unit-price`}>
                  Unit price ({currencyLabel})
                </Label>
                <Input
                  id={`${item.id}-unit-price`}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                  className="min-h-10"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${quoteId}-tax-rate`}>Tax %</Label>
          <Input
            id={`${quoteId}-tax-rate`}
            type="number"
            min={0}
            max={100}
            step="0.01"
            inputMode="decimal"
            value={taxRatePercent}
            onChange={(event) => setTaxRatePercent(event.target.value)}
            className="min-h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${quoteId}-discount`}>
            Discount ({currencyLabel})
          </Label>
          <Input
            id={`${quoteId}-discount`}
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={discountAmount}
            onChange={(event) => setDiscountAmount(event.target.value)}
            className="min-h-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <p>
            Subtotal:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(draftTotalCents.subtotal, currency)}
            </span>
          </p>
          <p>
            Tax:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(draftTotalCents.tax, currency)}
            </span>
          </p>
          <p>
            Discount:{" "}
            <span className="font-semibold text-foreground">
              -{formatCurrency(draftTotalCents.discount, currency)}
            </span>
          </p>
          <p>
            Draft total:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(draftTotalCents.total, currency)}
            </span>
          </p>
          <p className="text-xs">
            Saved total: {formatCurrency(totalCents, currency)} (subtotal{" "}
            {formatCurrency(subtotalCents, currency)}, tax{" "}
            {formatCurrency(taxCents, currency)})
          </p>
        </div>
        <SaveButton />
      </div>
    </form>
  );
}
