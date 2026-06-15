"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  adjustPartStock,
  createPart,
  updatePart,
} from "@/lib/parts/actions";
import type { PartActionResult, ClientPartRow } from "@/lib/parts/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/dashboard/dates";

const initialState: PartActionResult = { ok: false, error: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Saving…" : label}
    </Button>
  );
}

type PartsCatalogProps = {
  parts: ClientPartRow[];
};

export function PartsCatalog({ parts }: PartsCatalogProps) {
  const [createState, createAction] = useFormState(createPart, initialState);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-heading text-base font-semibold text-foreground">Add part</h2>
          <form action={createAction} className="space-y-4">
            {createState.ok === false && createState.error ? (
              <p role="alert" className="text-sm text-destructive">
                {createState.error}
              </p>
            ) : null}
            {createState.ok ? (
              <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
                Part added.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-sku">SKU</Label>
                <Input id="new-sku" name="sku" required className="min-h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input id="new-name" name="name" required className="min-h-11" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-qty">Qty on hand</Label>
                <Input id="new-qty" name="quantityOnHand" type="number" min={0} defaultValue="0" className="min-h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-unit">Unit price (cents)</Label>
                <Input id="new-unit" name="unitCents" type="number" min={0} defaultValue="0" className="min-h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-desc">Description</Label>
              <Textarea id="new-desc" name="description" rows={2} />
            </div>
            <SubmitButton label="Add part" />
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-4">
        {parts.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
            No parts in your catalog yet. Add your first SKU above — technicians can pick from this
            list when logging parts on work orders.
          </li>
        ) : null}
        {parts.map((part) => (
          <li key={part.id}>
            <PartRowCard part={part} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PartRowCard({ part }: { part: ClientPartRow }) {
  const [updateState, updateAction] = useFormState(updatePart, initialState);
  const [stockState, stockAction] = useFormState(adjustPartStock, initialState);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="partId" value={part.id} />
          {updateState.ok === false && updateState.error ? (
            <p role="alert" className="text-sm text-destructive">
              {updateState.error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor={`sku-${part.id}`}>SKU</Label>
              <Input id={`sku-${part.id}`} name="sku" defaultValue={part.sku} required className="min-h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`name-${part.id}`}>Name</Label>
              <Input id={`name-${part.id}`} name="name" defaultValue={part.name} required className="min-h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`qty-${part.id}`}>On hand</Label>
              <Input
                id={`qty-${part.id}`}
                name="quantityOnHand"
                type="number"
                min={0}
                defaultValue={String(part.quantityOnHand)}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`unit-${part.id}`}>Unit (¢)</Label>
              <Input
                id={`unit-${part.id}`}
                name="unitCents"
                type="number"
                min={0}
                defaultValue={String(part.unitCents)}
                className="min-h-11"
              />
            </div>
          </div>
          <SubmitButton label="Save" />
        </form>

        <form action={stockAction} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <input type="hidden" name="partId" value={part.id} />
          <div className="space-y-1">
            <Label htmlFor={`delta-${part.id}`} className="text-xs">
              Quick adjust (+/−)
            </Label>
            <Input
              id={`delta-${part.id}`}
              name="delta"
              type="number"
              placeholder="e.g. 5 or -2"
              className="min-h-10 w-28"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="min-h-10">
            Adjust stock
          </Button>
          {stockState.ok === false && stockState.error ? (
            <p role="alert" className="text-xs text-destructive">
              {stockState.error}
            </p>
          ) : null}
        </form>

        <p className="text-xs text-muted-foreground">Updated {formatDate(part.updatedAt)}</p>
      </CardContent>
    </Card>
  );
}
