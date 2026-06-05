"use client";

import { useState } from "react";
import { captureDeviceGps } from "@/lib/inspect/capture-gps";
import { enqueueOfflineMutation } from "@/lib/offline/indexeddb";
import { apiRecordVisitArrival } from "@/lib/offline/inspect-api";

type VisitArrivalPanelProps = {
  inspectionId: string;
  offlineMode: boolean;
  onArrived: (arrivedAt: Date) => void;
};

export function VisitArrivalPanel({
  inspectionId,
  offlineMode,
  onArrived,
}: VisitArrivalPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  async function handleCheckIn() {
    setError(null);
    setIsCheckingIn(true);

    try {
      const gps = await captureDeviceGps();
      if (!gps.ok) {
        setError(gps.error);
        return;
      }

      const arrivedAt = gps.coordinates.capturedAt
        ? new Date(gps.coordinates.capturedAt)
        : new Date();

      if (offlineMode) {
        await enqueueOfflineMutation({
          inspectionId,
          type: "inspection.arrive",
          payload: { coordinates: gps.coordinates },
        });
        onArrived(arrivedAt);
        return;
      }

      const response = await apiRecordVisitArrival(inspectionId, gps.coordinates);
      if (!response.ok) {
        setError(response.error);
        return;
      }

      onArrived(arrivedAt);
    } finally {
      setIsCheckingIn(false);
    }
  }

  return (
    <section
      aria-labelledby="visit-arrival-heading"
      className="mx-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5"
    >
      <h2 id="visit-arrival-heading" className="text-lg font-semibold text-amber-100">
        Check in on site
      </h2>
      <p className="mt-2 text-sm text-amber-100/80">
        Confirm you are at the building before starting the checklist. Your location and time are
        recorded as visit proof.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isCheckingIn}
        onClick={() => void handleCheckIn()}
        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-amber-500 text-base font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {isCheckingIn ? "Getting location…" : "I'm on site — check in"}
      </button>
    </section>
  );
}
