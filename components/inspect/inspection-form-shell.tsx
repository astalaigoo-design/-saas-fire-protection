"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { InspectionForm } from "@/components/inspect/inspection-form";
import { setActiveInspectionId } from "@/lib/offline/active-inspection";
import { cacheInspectionForOffline } from "@/lib/offline/cache-page";
import { getInspectionSnapshot } from "@/lib/offline/indexeddb";
import {
  parseInspectionSnapshot,
  preferOfflineInspection,
} from "@/lib/offline/inspection-snapshot";
import type { InspectionFormData } from "@/lib/inspect/queries";

type InspectionFormShellProps = {
  inspectionId: string;
  serverInspection: InspectionFormData | null;
};

function InspectionFormSkeleton() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 p-6 text-slate-50">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/3 rounded bg-slate-800" />
        <div className="h-10 w-2/3 rounded bg-slate-800" />
        <div className="h-32 rounded-xl bg-slate-900" />
        <div className="h-48 rounded-xl bg-slate-900" />
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">Loading inspection…</p>
    </div>
  );
}

function OfflineInspectionUnavailable({ inspectionId }: { inspectionId: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-slate-950 p-6 text-slate-50">
      <h1 className="text-lg font-semibold text-white">Inspection not available offline</h1>
      <p className="mt-2 text-sm text-slate-400">
        Open this job from My Jobs while you have internet once. After that, you can work offline
        on this device — including other jobs you have opened online.
      </p>
      <p className="mt-2 font-mono text-xs text-slate-500">{inspectionId.slice(0, 12)}…</p>
      <Link
        href="/dashboard/my-jobs"
        className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-white"
      >
        Back to my jobs
      </Link>
    </div>
  );
}

export function InspectionFormShell({
  inspectionId,
  serverInspection,
}: InspectionFormShellProps) {
  const [inspection, setInspection] = useState<InspectionFormData | null>(null);
  const [ready, setReady] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const serverRef = useRef(serverInspection);
  if (serverInspection) serverRef.current = serverInspection;

  const bootstrap = useCallback(async () => {
    const cachedRow = await getInspectionSnapshot(inspectionId);
    const cached = cachedRow ? parseInspectionSnapshot(cachedRow.snapshot) : null;
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const server = serverRef.current;
    const resolved = preferOfflineInspection(server, cached, offline);

    if (resolved) {
      setInspection(resolved);
      setOfflineOnly(offline && !server);
      setActiveInspectionId(inspectionId);
      setReady(true);
      return;
    }

    setInspection(null);
    setOfflineOnly(offline);
    setReady(true);
  }, [inspectionId]);

  useEffect(() => {
    setReady(false);
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onConnectivityChange = () => {
      void bootstrap();
    };
    window.addEventListener("online", onConnectivityChange);
    window.addEventListener("offline", onConnectivityChange);
    return () => {
      window.removeEventListener("online", onConnectivityChange);
      window.removeEventListener("offline", onConnectivityChange);
    };
  }, [bootstrap]);

  useEffect(() => {
    if (!ready || !inspection) return;
    cacheInspectionForOffline(inspectionId);
  }, [ready, inspection, inspectionId]);

  if (!ready) return <InspectionFormSkeleton />;
  if (!inspection) return <OfflineInspectionUnavailable inspectionId={inspectionId} />;

  return (
    <InspectionForm
      key={`${inspection.id}-${offlineOnly ? "offline" : "online"}`}
      inspection={inspection}
      offlineOnly={offlineOnly}
    />
  );
}
