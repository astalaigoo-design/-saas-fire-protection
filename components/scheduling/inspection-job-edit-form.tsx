"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateInspectionJob,
  type UpdateInspectionJobState,
} from "@/lib/scheduling/update-inspection-job-actions";
import { toDateInputValue } from "@/lib/scheduling/calendar";
import type { ScheduleFormData } from "@/lib/scheduling/queries";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InspectionJobEditFormProps = {
  inspectionId: string;
  scheduledAt: Date;
  assignedToUserId: string | null;
  buildingLabel: string;
  inspectionTypeName: string;
  status: string;
  formData: ScheduleFormData;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Saving…" : "Save & notify technician"}
    </Button>
  );
}

export function InspectionJobEditForm({
  inspectionId,
  scheduledAt,
  assignedToUserId,
  buildingLabel,
  inspectionTypeName,
  status,
  formData,
}: InspectionJobEditFormProps) {
  const [state, formAction] = useFormState<
    UpdateInspectionJobState | undefined,
    FormData
  >(updateInspectionJob, undefined);

  const dateValue = toDateInputValue(scheduledAt);
  const timeValue = scheduledAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <input type="hidden" name="inspectionId" value={inspectionId} />

      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium text-foreground">{buildingLabel}</p>
        <p className="text-muted-foreground">
          {inspectionTypeName} · <span className="capitalize">{status.replace(/_/g, " ")}</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Changing the schedule or assignee emails the technician when Resend is configured and
          they have an email on file.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="scheduled-date">Date</Label>
          <Input id="scheduled-date" name="scheduledDate" type="date" defaultValue={dateValue} required className="min-h-11" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="scheduled-time">Time</Label>
          <Input id="scheduled-time" name="scheduledTime" type="time" defaultValue={timeValue} required className="min-h-11" />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="assigned-to">Assigned technician</Label>
        <select
          id="assigned-to"
          name="assignedToUserId"
          defaultValue={assignedToUserId ?? ""}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Unassigned</option>
          {formData.technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.label}
            </option>
          ))}
        </select>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Link
          href={`/inspect/${inspectionId}`}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
        >
          Open in field app
        </Link>
        <Link href="/dashboard/jobs" className={cn(buttonVariants({ variant: "ghost" }), "min-h-11")}>
          Back to calendar
        </Link>
      </div>
    </form>
  );
}
