"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
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
    () =>
      draftItems.reduce((sum, item) => {
        const quantity = Number(item.quantity || "0");
        const unitPrice = Number(item.unitPrice || "0");
        if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return sum;
        return sum + Math.round(unitPrice * 100) * quantity;
      }, 0),
    [draftItems],
  );

  function updateItem(id: string, patch: Partial<LineItemDraft>) {
    setDraftItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-4 rounded-lg border border-border/70 p-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="lineItemsJson" value={payload} readOnly />

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
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                type="number"
                min={1}
                step={1}
                value={item.quantity}
                onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                className="min-h-10"
                aria-label={`Quantity for ${item.label}`}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                className="min-h-10"
                aria-label={`Unit price for ${item.label}`}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Draft total:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(draftTotalCents, currency)}
          </span>
        </p>
        <SaveButton />
      </div>
    </form>
  );
}
