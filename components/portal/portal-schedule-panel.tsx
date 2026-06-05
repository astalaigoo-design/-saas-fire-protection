"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PORTAL_TIME_SLOTS } from "@/lib/customers/portal-schedule";
import { cn } from "@/lib/utils";

type PortalSchedulePanelProps = {
  portalToken: string;
  buildings: { id: string; label: string }[];
  inspectionTypes: { id: string; name: string }[];
  scheduleMinDate: string;
  scheduleMaxDate: string;
};

type PanelState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "done"; message: string }
  | { phase: "error"; message: string };

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function PortalSchedulePanel({
  portalToken,
  buildings,
  inspectionTypes,
  scheduleMinDate,
  scheduleMaxDate,
}: PortalSchedulePanelProps) {
  const router = useRouter();
  const [state, setState] = useState<PanelState>({ phase: "idle" });
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "");
  const [inspectionTypeId, setInspectionTypeId] = useState(inspectionTypes[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState(scheduleMinDate);
  const [scheduledTime, setScheduledTime] = useState<(typeof PORTAL_TIME_SLOTS)[number]>("09:00");
  const [notes, setNotes] = useState("");

  const canSchedule = buildings.length > 0 && inspectionTypes.length > 0;
  const isSubmitting = state.phase === "submitting";

  if (state.phase === "done") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-900/60 bg-emerald-950/40 p-5 text-sm text-emerald-100"
      >
        {state.message}
      </div>
    );
  }

  if (!canSchedule) {
    return (
      <p className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
        Scheduling is not available yet. Contact your contractor to book a visit.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!buildingId || !inspectionTypeId || !scheduledDate || !scheduledTime) {
      setState({ phase: "error", message: "Complete all required fields." });
      return;
    }

    setState({ phase: "submitting" });

    try {
      const response = await fetch(`/api/public/portal/${portalToken}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId,
          inspectionTypeId,
          scheduledDate,
          scheduledTime,
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };

      if (!data.ok) {
        setState({
          phase: "error",
          message: data.error ?? "Could not schedule the inspection.",
        });
        return;
      }

      setState({
        phase: "done",
        message: data.message ?? "Your visit is requested. The contractor will confirm.",
      });
      router.refresh();
    } catch {
      setState({
        phase: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
    >
      <h2 className="text-lg font-semibold text-white">Request an inspection</h2>
      <p className="mt-1 text-sm text-slate-400">
        Pick a building, inspection type, and preferred date. Your contractor will confirm the
        visit and assign a technician.
      </p>

      {state.phase === "error" ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Building</span>
          <select
            required
            value={buildingId}
            onChange={(event) => setBuildingId(event.target.value)}
            disabled={isSubmitting}
            className="mt-2 flex min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Inspection type</span>
          <select
            required
            value={inspectionTypeId}
            onChange={(event) => setInspectionTypeId(event.target.value)}
            disabled={isSubmitting}
            className="mt-2 flex min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            {inspectionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Preferred date</span>
          <input
            required
            type="date"
            min={scheduleMinDate}
            max={scheduleMaxDate}
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            disabled={isSubmitting}
            className="mt-2 flex min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-slate-200">Preferred time</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PORTAL_TIME_SLOTS.map((slot) => (
              <label
                key={slot}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-sm font-medium",
                  scheduledTime === slot
                    ? "border-amber-500 bg-amber-500/10 text-amber-200"
                    : "border-slate-700 text-slate-300 hover:border-slate-600",
                  isSubmitting && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="scheduledTime"
                  value={slot}
                  checked={scheduledTime === slot}
                  onChange={() => setScheduledTime(slot)}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                {formatTimeLabel(slot)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Notes <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting}
            maxLength={2000}
            rows={3}
            placeholder="Gate code, contact on site, access restrictions…"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Request visit"}
      </button>
    </form>
  );
}
