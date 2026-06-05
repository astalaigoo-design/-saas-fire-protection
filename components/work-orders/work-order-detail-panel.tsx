"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  addWorkOrderPartLine,
  removeWorkOrderPartLine,
  updateWorkOrder,
  type WorkOrderActionResult,
} from "@/lib/work-orders/actions";
import { WORK_ORDER_STATUSES, workOrderStatusLabel } from "@/lib/work-orders/constants";
import type { WorkOrderDetail } from "@/lib/work-orders/queries";
import type { PartRow } from "@/lib/parts/queries";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate, formatDateTime } from "@/lib/dashboard/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/lib/ui/native-select";

const initialState: WorkOrderActionResult = { ok: false, error: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Saving…" : "Save work order"}
    </Button>
  );
}

type WorkOrderDetailPanelProps = {
  workOrder: WorkOrderDetail;
  technicians: { id: string; name: string | null }[];
  parts: PartRow[];
  canEdit?: boolean;
};

export function WorkOrderDetailPanel({
  workOrder,
  technicians,
  parts,
  canEdit = true,
}: WorkOrderDetailPanelProps) {
  const [updateState, updateAction] = useFormState(updateWorkOrder, initialState);
  const [lineState, lineAction] = useFormState(addWorkOrderPartLine, initialState);
  const closed =
    workOrder.status === "completed" || workOrder.status === "cancelled" || !canEdit;

  const lineTotalCents = workOrder.partLines.reduce(
    (sum, line) => sum + line.quantity * line.unitCents,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/dashboard/work-orders" className="text-sm text-primary hover:underline">
          ← Work orders
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-foreground">{workOrder.title}</h1>
        <p className="text-sm text-muted-foreground">
          {buildingLabel(workOrder.building)} · {workOrder.building.customer.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Status: {workOrderStatusLabel(workOrder.status)}
          {workOrder.deficiency ? ` · Linked deficiency: ${workOrder.deficiency.label}` : ""}
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="workOrderId" value={workOrder.id} />
            {updateState.ok === false && updateState.error ? (
              <p role="alert" className="text-sm text-destructive">
                {updateState.error}
              </p>
            ) : null}
            {updateState.ok ? (
              <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
                Saved.
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={workOrder.title}
                required
                disabled={closed}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={workOrder.description ?? ""}
                disabled={closed}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={workOrder.status}
                  disabled={closed}
                  className={nativeSelectClassName}
                >
                  {WORK_ORDER_STATUSES.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled</Label>
                <Input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="date"
                  disabled={closed}
                  defaultValue={
                    workOrder.scheduledAt
                      ? workOrder.scheduledAt.toISOString().slice(0, 10)
                      : undefined
                  }
                  className="min-h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToUserId">Assigned to</Label>
              <select
                id="assignedToUserId"
                name="assignedToUserId"
                defaultValue={workOrder.assignedTo?.id ?? ""}
                disabled={closed}
                className={nativeSelectClassName}
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name ?? "Technician"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={workOrder.notes ?? ""}
                disabled={closed}
              />
            </div>
            {!closed ? <SaveButton /> : null}
          </form>
          {workOrder.completedAt ? (
            <p className="text-sm text-muted-foreground">
              Completed {formatDateTime(workOrder.completedAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-heading text-base font-semibold">Parts used</h2>
          {workOrder.partLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts on this work order yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {workOrder.partLines.map((line) => (
                <li key={line.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{line.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty {line.quantity}
                      {line.part ? ` · SKU ${line.part.sku} (${line.part.quantityOnHand} on hand)` : ""}
                    </p>
                  </div>
                  {!closed ? (
                    <RemoveLineForm workOrderId={workOrder.id} lineId={line.id} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm font-medium text-foreground">
            Parts subtotal:{" "}
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
              lineTotalCents / 100,
            )}
          </p>
          {!closed ? (
            <form action={lineAction} className="space-y-4 border-t border-border pt-4">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              {lineState.ok === false && lineState.error ? (
                <p role="alert" className="text-sm text-destructive">
                  {lineState.error}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partId">From catalog (optional)</Label>
                  <select id="partId" name="partId" defaultValue="" className={nativeSelectClassName}>
                    <option value="">Ad-hoc line</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} ({p.quantityOnHand} on hand)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Line label</Label>
                  <Input id="label" name="label" required className="min-h-11" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} className="min-h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCents">Unit price (cents)</Label>
                  <Input id="unitCents" name="unitCents" type="number" min={0} defaultValue={0} className="min-h-11" />
                </div>
              </div>
              <Button type="submit" variant="outline" className="min-h-11">
                Add part line
              </Button>
            </form>
          ) : null}
          {closed && workOrder.status === "completed" ? (
            <p className="text-xs text-muted-foreground">
              Completing this work order decremented catalog stock for linked part lines.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RemoveLineForm({
  workOrderId,
  lineId,
}: {
  workOrderId: string;
  lineId: string;
}) {
  const [state, formAction] = useFormState(removeWorkOrderPartLine, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="lineId" value={lineId} />
      {state.ok === false && state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="ghost" size="sm" className="min-h-10 text-muted-foreground">
        Remove
      </Button>
    </form>
  );
}
