"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { DeficiencyStatusBadge } from "@/components/deficiencies/deficiency-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignDeficiency,
  updateDeficiencyDueDate,
  updateDeficiencyStatus,
  type DeficiencyActionState,
} from "@/lib/deficiencies/actions";
import type { DeficiencyRow } from "@/lib/deficiencies/queries";
import { DeficiencyStatus } from "@prisma/client";
import { formatDate } from "@/lib/dashboard/dates";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssignableStaff = { id: string; name: string | null; role: string };

type DeficiencyWorkflowCardProps = {
  deficiency: DeficiencyRow;
  assignableStaff: AssignableStaff[];
  showBuildingLink?: boolean;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending} className="min-h-9">
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function DeficiencyWorkflowCard({
  deficiency,
  assignableStaff,
  showBuildingLink = true,
}: DeficiencyWorkflowCardProps) {
  const [assignState, assignAction] = useFormState<
    DeficiencyActionState | undefined,
    FormData
  >(assignDeficiency, undefined);
  const [dueState, dueAction] = useFormState<DeficiencyActionState | undefined, FormData>(
    updateDeficiencyDueDate,
    undefined,
  );
  const [statusState, statusAction] = useFormState<
    DeficiencyActionState | undefined,
    FormData
  >(updateDeficiencyStatus, undefined);

  const dueDateValue = deficiency.dueAt
    ? deficiency.dueAt.toISOString().slice(0, 10)
    : "";

  const error =
    (assignState && !assignState.ok ? assignState.error : null) ??
    (dueState && !dueState.ok ? dueState.error : null) ??
    (statusState && !statusState.ok ? statusState.error : null);

  return (
    <CardShell>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">{deficiency.label}</p>
          {deficiency.description ? (
            <p className="text-xs leading-5 text-muted-foreground">{deficiency.description}</p>
          ) : null}
        </div>
        <DeficiencyStatusBadge status={deficiency.status} />
      </div>

      <p className="text-sm text-muted-foreground">
        {showBuildingLink ? (
          <Link
            href={`/dashboard/buildings/${deficiency.buildingId}`}
            className="text-primary hover:underline"
          >
            {deficiency.buildingLabel}
          </Link>
        ) : (
          deficiency.buildingLabel
        )}
        {" · "}
        {deficiency.customerName} · {deficiency.inspectionTypeName}
      </p>

      {deficiency.notes ? (
        <p className="text-xs text-muted-foreground">Inspector note: {deficiency.notes}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {deficiency.sourceCompletedAt
          ? `Found ${formatDate(deficiency.sourceCompletedAt)}`
          : "Found on inspection"}
        {deficiency.dueAt ? ` · Due ${formatDate(deficiency.dueAt)}` : ""}
        {deficiency.assignedTo?.name ? ` · ${deficiency.assignedTo.name}` : ""}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/quotes"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {deficiency.quoteId ? "Review quote" : "Create quote"}
        </Link>
        <Link
          href={`/inspect/${deficiency.sourceInspectionId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Source job
        </Link>
      </div>

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
        <form action={assignAction} className="space-y-2">
          <input type="hidden" name="deficiencyId" value={deficiency.id} />
          <Label htmlFor={`assign-${deficiency.id}`} className="text-xs">
            Assignee
          </Label>
          <select
            id={`assign-${deficiency.id}`}
            name="assignedToUserId"
            defaultValue={deficiency.assignedTo?.id ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Unassigned</option>
            {assignableStaff.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.role}
              </option>
            ))}
          </select>
          <SubmitButton label="Update assignee" />
        </form>

        <form action={dueAction} className="space-y-2">
          <input type="hidden" name="deficiencyId" value={deficiency.id} />
          <Label htmlFor={`due-${deficiency.id}`} className="text-xs">
            Corrective action due
          </Label>
          <Input
            id={`due-${deficiency.id}`}
            name="dueDate"
            type="date"
            defaultValue={dueDateValue}
            className="min-h-10"
          />
          <SubmitButton label="Update due date" />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {deficiency.status !== DeficiencyStatus.resolved &&
        deficiency.status !== DeficiencyStatus.verified ? (
          <form action={statusAction}>
            <input type="hidden" name="deficiencyId" value={deficiency.id} />
            <input type="hidden" name="status" value={DeficiencyStatus.resolved} />
            <SubmitButton label="Mark resolved" />
          </form>
        ) : null}
        {deficiency.status === DeficiencyStatus.resolved ? (
          <>
            <form action={statusAction}>
              <input type="hidden" name="deficiencyId" value={deficiency.id} />
              <input type="hidden" name="status" value={DeficiencyStatus.verified} />
              <SubmitButton label="Mark verified" />
            </form>
            <form action={statusAction}>
              <input type="hidden" name="deficiencyId" value={deficiency.id} />
              <input type="hidden" name="status" value={DeficiencyStatus.owned} />
              <SubmitButton label="Reopen to owned" />
            </form>
          </>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </CardShell>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {children}
    </div>
  );
}
