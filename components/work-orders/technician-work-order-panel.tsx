"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { MyJobSiteActions } from "@/components/dashboard/my-job-site-actions";
import {
  addTechnicianWorkOrderPartLine,
  completeTechnicianWorkOrder,
  removeTechnicianWorkOrderPartLine,
  startTechnicianWorkOrder,
  updateTechnicianWorkOrderNotes,
} from "@/lib/work-orders/technician-actions";
import type { WorkOrderActionResult } from "@/lib/work-orders/actions";
import { workOrderStatusLabel } from "@/lib/work-orders/constants";
import type { WorkOrderDetail } from "@/lib/work-orders/queries";
import type { PartRow } from "@/lib/parts/queries";
import { buildingLabel, buildingMapsSearchQuery } from "@/lib/customers/format";
import { formatDate, formatDateTime } from "@/lib/dashboard/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import { cn } from "@/lib/utils";

const initialState: WorkOrderActionResult = { ok: false, error: "" };

function ActionButton({
  label,
  pendingLabel,
  variant = "default",
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} className="min-h-11 w-full sm:w-auto">
      {pending ? pendingLabel : label}
    </Button>
  );
}

type TechnicianWorkOrderPanelProps = {
  workOrder: WorkOrderDetail;
  parts: PartRow[];
};

export function TechnicianWorkOrderPanel({ workOrder, parts }: TechnicianWorkOrderPanelProps) {
  const [startState, startAction] = useFormState(startTechnicianWorkOrder, initialState);
  const [notesState, notesAction] = useFormState(updateTechnicianWorkOrderNotes, initialState);
  const [completeState, completeAction] = useFormState(completeTechnicianWorkOrder, initialState);
  const [lineState, lineAction] = useFormState(addTechnicianWorkOrderPartLine, initialState);

  const closed =
    workOrder.status === "completed" || workOrder.status === "cancelled";
  const canStart = workOrder.status === "draft" || workOrder.status === "scheduled";
  const canComplete = workOrder.status === "in_progress";
  const canEdit = !closed;

  const mapsQuery = buildingMapsSearchQuery(workOrder.building);
  const lineTotalCents = workOrder.partLines.reduce(
    (sum, line) => sum + line.quantity * line.unitCents,
    0,
  );

  const actionError =
    (startState.ok === false ? startState.error : null) ??
    (notesState.ok === false ? notesState.error : null) ??
    (completeState.ok === false ? completeState.error : null) ??
    (lineState.ok === false ? lineState.error : null);

  const actionSuccess =
    startState.ok || notesState.ok || completeState.ok || lineState.ok;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <Link href="/dashboard/my-jobs" className="text-sm font-medium text-primary hover:underline">
          ← My jobs
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-foreground">{workOrder.title}</h1>
        <p className="text-sm text-muted-foreground">
          {buildingLabel(workOrder.building)} · {workOrder.building.customer.name}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              workOrder.status === "in_progress" &&
                "bg-amber-500/15 text-amber-900 dark:text-amber-100",
              (workOrder.status === "draft" || workOrder.status === "scheduled") &&
                "bg-sky-500/15 text-sky-900 dark:text-sky-100",
              workOrder.status === "completed" &&
                "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
            )}
          >
            {workOrderStatusLabel(workOrder.status)}
          </span>
          {workOrder.scheduledAt ? (
            <span className="text-xs text-muted-foreground">
              Scheduled {formatDate(workOrder.scheduledAt)}
            </span>
          ) : null}
        </div>
        {workOrder.description ? (
          <p className="text-sm text-muted-foreground">{workOrder.description}</p>
        ) : null}
        {workOrder.deficiency ? (
          <p className="text-xs text-muted-foreground">
            Linked repair: {workOrder.deficiency.label}
          </p>
        ) : null}
      </header>

      <Card>
        <CardContent className="pt-4">
          <MyJobSiteActions mapsQuery={mapsQuery} compact />
        </CardContent>
      </Card>

      {actionError ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      {actionSuccess ? (
        <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          Saved.
        </p>
      ) : null}

      {canStart ? (
        <form action={startAction}>
          <input type="hidden" name="workOrderId" value={workOrder.id} />
          <ActionButton label="Start work" pendingLabel="Starting…" />
        </form>
      ) : null}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-heading text-base font-semibold">Field notes</h2>
          <form action={notesAction} className="space-y-4">
            <input type="hidden" name="workOrderId" value={workOrder.id} />
            <div className="space-y-2">
              <Label htmlFor="notes">What you did on site</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                disabled={!canEdit}
                defaultValue={workOrder.notes ?? ""}
                placeholder="Parts replaced, access issues, follow-up needed…"
              />
            </div>
            {canEdit ? (
              <ActionButton label="Save notes" pendingLabel="Saving…" variant="outline" />
            ) : null}
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
            <p className="text-sm text-muted-foreground">No parts logged yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {workOrder.partLines.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{line.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty {line.quantity}
                      {line.part ? ` · ${line.part.sku} (${line.part.quantityOnHand} on hand)` : ""}
                    </p>
                  </div>
                  {canEdit ? <RemovePartLineForm workOrderId={workOrder.id} lineId={line.id} /> : null}
                </li>
              ))}
            </ul>
          )}
          {lineTotalCents > 0 ? (
            <p className="text-sm font-medium text-foreground">
              Parts subtotal:{" "}
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                lineTotalCents / 100,
              )}
            </p>
          ) : null}

          {canEdit ? (
            <form action={lineAction} className="space-y-4 border-t border-border pt-4">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <div className="space-y-2">
                <Label htmlFor="partId">From parts catalog (optional)</Label>
                <select id="partId" name="partId" defaultValue="" className={nativeSelectClassName}>
                  <option value="">Custom line</option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.sku} — {part.name} ({part.quantityOnHand} on hand)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Description</Label>
                <Input id="label" name="label" required className="min-h-11" placeholder="e.g. Dry pipe gauge" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCents">Unit price (cents, optional)</Label>
                  <Input
                    id="unitCents"
                    name="unitCents"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="min-h-11"
                  />
                </div>
              </div>
              <ActionButton label="Add part" pendingLabel="Adding…" variant="outline" />
            </form>
          ) : null}
        </CardContent>
      </Card>

      {canComplete ? (
        <form action={completeAction}>
          <input type="hidden" name="workOrderId" value={workOrder.id} />
          <ActionButton label="Mark complete" pendingLabel="Completing…" />
          <p className="mt-2 text-xs text-muted-foreground">
            Completing decrements catalog stock for linked parts and updates the equipment register
            when this repair is tied to a deficiency.
          </p>
        </form>
      ) : null}
    </div>
  );
}

function RemovePartLineForm({
  workOrderId,
  lineId,
}: {
  workOrderId: string;
  lineId: string;
}) {
  const [state, formAction] = useFormState(removeTechnicianWorkOrderPartLine, initialState);
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
