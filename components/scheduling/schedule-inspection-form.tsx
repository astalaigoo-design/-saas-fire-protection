"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  scheduleInspection,
  type ScheduleInspectionFormState,
} from "@/lib/scheduling/actions";
import { recurrenceFormValues } from "@/lib/scheduling/schemas";
import type { ScheduleFormData } from "@/lib/scheduling/queries";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ScheduleInspectionFormProps = {
  formData: ScheduleFormData;
  defaultDate: string;
  defaultTime?: string;
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
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-11 bg-amber-500 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60",
      )}
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
}: ScheduleInspectionFormProps) {
  const [state, formAction] = useFormState(scheduleInspection, initialState);
  const buildingGroups = groupBuildingsByCustomer(formData.buildings);

  if (formData.buildings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
        Add a customer and building before scheduling inspections.{" "}
        <Link href="/dashboard/customers/new" className="text-amber-400 hover:underline">
          New customer
        </Link>
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-xl bg-slate-900/70 text-white ring-slate-800">
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.ok === false && state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            >
              {state.error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-300">Date</span>
              <Input
                type="date"
                name="scheduledDate"
                required
                defaultValue={defaultDate}
                className="h-11 border-slate-700 bg-slate-950 text-white"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-300">Time</span>
              <Input
                type="time"
                name="scheduledTime"
                required
                defaultValue={defaultTime}
                className="h-11 border-slate-700 bg-slate-950 text-white"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">
              Building <span className="text-amber-400">*</span>
            </span>
            <select
              name="buildingId"
              required
              defaultValue=""
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">
              Inspection type <span className="text-amber-400">*</span>
            </span>
            <select
              name="inspectionTypeId"
              required
              defaultValue=""
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Assign technician</span>
            <select
              name="assignedToUserId"
              defaultValue=""
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Unassigned</option>
              {formData.technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.label}
                </option>
              ))}
            </select>
            {formData.technicians.length === 0 ? (
              <p className="text-xs text-slate-500">
                No technicians linked yet. Link Clerk users with the technician role.
              </p>
            ) : null}
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-slate-300">Recurrence</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {recurrenceFormValues.map((value) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 has-[:checked]:border-amber-500/60 has-[:checked]:bg-amber-500/5"
                >
                  <input
                    type="radio"
                    name="recurrence"
                    value={value}
                    defaultChecked={value === "none"}
                    className="h-4 w-4 border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-200">{recurrenceLabels[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Notes</span>
            <Textarea
              name="notes"
              rows={3}
              className="border-slate-700 bg-slate-950 text-white"
              placeholder="Optional instructions for the technician"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton />
            <Link
              href="/dashboard/jobs"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 text-amber-400 hover:bg-transparent hover:text-amber-300",
              )}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
