"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createWorkOrder, type WorkOrderActionResult } from "@/lib/work-orders/actions";
import { buildingLabel } from "@/lib/customers/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import { cn } from "@/lib/utils";

const initialState: WorkOrderActionResult = { ok: false, error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Creating…" : "Create work order"}
    </Button>
  );
}

type NewWorkOrderFormProps = {
  buildings: {
    id: string;
    name: string | null;
    addressLine1: string;
    city: string;
    customer: { name: string };
  }[];
  technicians: { id: string; name: string | null }[];
  defaultBuildingId?: string;
  defaultDeficiencyId?: string;
  defaultQuoteId?: string;
};

export function NewWorkOrderForm({
  buildings,
  technicians,
  defaultBuildingId,
  defaultDeficiencyId,
  defaultQuoteId,
}: NewWorkOrderFormProps) {
  const [state, formAction] = useFormState(createWorkOrder, initialState);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <form action={formAction} className="space-y-4">
          {state.ok === false && state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="buildingId">Building</Label>
            <select
              id="buildingId"
              name="buildingId"
              required
              defaultValue={defaultBuildingId ?? ""}
              className={nativeSelectClassName}
            >
              <option value="" disabled>
                Select building
              </option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {buildingLabel(b)} · {b.customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Replace riser gauge" className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled date</Label>
              <Input id="scheduledAt" name="scheduledAt" type="date" className="min-h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToUserId">Assign to</Label>
              <select id="assignedToUserId" name="assignedToUserId" defaultValue="" className={nativeSelectClassName}>
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name ?? "Technician"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {defaultDeficiencyId ? (
            <input type="hidden" name="deficiencyId" value={defaultDeficiencyId} />
          ) : null}
          {defaultQuoteId ? <input type="hidden" name="quoteId" value={defaultQuoteId} /> : null}
          <div className="flex flex-wrap gap-3">
            <SubmitButton />
            <Link
              href="/dashboard/work-orders"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
