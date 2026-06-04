"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mergeCustomers, type MergeCustomersResult } from "@/lib/customers/merge-actions";

type CustomerMergeFormProps = {
  customerId: string;
  customerName: string;
  candidates: { id: string; name: string; buildingCount: number }[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="min-h-10">
      {pending ? "Merging…" : "Merge into selected account"}
    </Button>
  );
}

export function CustomerMergeForm({
  customerId,
  customerName,
  candidates,
}: CustomerMergeFormProps) {
  const [state, formAction] = useFormState<MergeCustomersResult | undefined, FormData>(
    mergeCustomers,
    undefined,
  );

  if (candidates.length === 0) return null;

  return (
    <section
      aria-labelledby="customer-merge-heading"
      className="max-w-2xl rounded-xl border border-destructive/30 bg-card p-4 shadow-sm"
    >
      <h2
        id="customer-merge-heading"
        className="font-heading text-base font-semibold text-foreground"
      >
        Merge duplicate
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Move all buildings and contacts from <strong>{customerName}</strong> into another customer,
        then delete this account. This cannot be undone.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="sourceCustomerId" value={customerId} />
        {state?.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="merge-target">Merge into</Label>
          <select
            id="merge-target"
            name="targetCustomerId"
            required
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose customer…</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} ({candidate.buildingCount}{" "}
                {candidate.buildingCount === 1 ? "building" : "buildings"})
              </option>
            ))}
          </select>
        </div>
        <SubmitButton />
      </form>
    </section>
  );
}
