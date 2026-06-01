"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  scheduleInspection,
  type ScheduleInspectionFormState,
} from "@/lib/scheduling/actions";
import { recurrenceFormValues } from "@/lib/scheduling/schemas";
import type { ScheduleFormData } from "@/lib/scheduling/queries";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ScheduleInspectionFormProps = {
  formData: ScheduleFormData;
  defaultDate: string;
  defaultTime?: string;
  defaultBuildingId?: string;
};

const initialState: ScheduleInspectionFormState = { ok: false, error: "" };

const recurrenceLabels: Record<(typeof recurrenceFormValues)[number], string> = {
  none: "One-time",
  monthly: "Monthly (12 visits)",
  quarterly: "Quarterly (4 visits)",
  annual: "Annual (3 visits)",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5 disabled:opacity-60")}
    >
      {pending ? "Scheduling…" : "Schedule inspection"}
    </button>
  );
}

function groupBuildingsByCustomer(buildings: ScheduleFormData["buildings"]) {
  const groups = new Map<string, ScheduleFormData["buildings"]>();
  for (const building of buildings) {
    const list = groups.get(building.customerName) ?? [];
    list.push(building);
    groups.set(building.customerName, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function ScheduleInspectionForm({
  formData,
  defaultDate,
  defaultTime = "10:00",
  defaultBuildingId,
}: ScheduleInspectionFormProps) {
  const [state, formAction] = useFormState(scheduleInspection, initialState);
  const buildingGroups = groupBuildingsByCustomer(formData.buildings);

  if (formData.buildings.length === 0) {
    return (
      <EmptyState
        title="Add a customer and building first"
        description="You need at least one site before scheduling inspections."
      >
        <Link
          href="/dashboard/customers/new"
          className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
        >
          New customer
        </Link>
      </EmptyState>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.ok === false && state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                name="scheduledDate"
                required
                defaultValue={defaultDate}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Time</Label>
              <Input
                id="scheduled-time"
                type="time"
                name="scheduledTime"
                required
                defaultValue={defaultTime}
                className="min-h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="building-id">
              Building <span className="text-primary">*</span>
            </Label>
            <select
              id="building-id"
              name="buildingId"
              required
              defaultValue={defaultBuildingId ?? ""}
              className={nativeSelectClassName}
            >
              <option value="" disabled>
                Select a building
              </option>
              {buildingGroups.map(([customerName, buildings]) => (
                <optgroup key={customerName} label={customerName}>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspection-type-id">
              Inspection type <span className="text-primary">*</span>
            </Label>
            <select
              id="inspection-type-id"
              name="inspectionTypeId"
              required
              defaultValue=""
              className={nativeSelectClassName}
            >
              <option value="" disabled>
                Select type
              </option>
              {formData.inspectionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Checklist items are created automatically from NFPA rules for the selected type
              (cadence or system pack).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned-user">Assign technician</Label>
            <select
              id="assigned-user"
              name="assignedToUserId"
              defaultValue=""
              className={nativeSelectClassName}
            >
              <option value="">Unassigned</option>
              {formData.technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.label}
                </option>
              ))}
            </select>
            {formData.technicians.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No technicians linked yet. Link Clerk users with the technician role.
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Recurrence</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {recurrenceFormValues.map((value) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-muted/20 px-3 py-2 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="recurrence"
                    value={value}
                    defaultChecked={value === "none"}
                    className="h-4 w-4 border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{recurrenceLabels[value]}</span>
                </label>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Failed inspections auto-schedule a follow-up in 14 days. Monthly, quarterly, and
              annual jobs auto-schedule the next cadence visit when a technician
              submits the inspection. Email reminders go to your report email 7 days before due
              dates.
            </p>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="schedule-notes">Notes</Label>
            <Textarea
              id="schedule-notes"
              name="notes"
              rows={3}
              placeholder="Optional instructions for the technician"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton />
            <Link
              href="/dashboard/jobs"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "min-h-11")}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
