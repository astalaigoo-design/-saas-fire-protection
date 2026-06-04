"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { InspectionForm } from "@/components/inspect/inspection-form";
import { setActiveInspectionId } from "@/lib/offline/active-inspection";
import { cacheInspectionForOffline } from "@/lib/offline/cache-page";
import { warmUrlForOffline } from "@/lib/offline/warm-cache";
import { getJobCatalog, saveJobCatalog } from "@/lib/offline/job-catalog";
import { buildingLabel } from "@/lib/customers/format";
import { getInspectionSnapshot } from "@/lib/offline/indexeddb";
import {
  parseInspectionSnapshot,
  preferOfflineInspection,
} from "@/lib/offline/inspection-snapshot";
import type { AppRole } from "@/lib/auth/roles";
import type { InspectionFormData } from "@/lib/inspect/queries";
import {
  hydratePreJobBrief,
  type ClientPreJobBrief,
  type PreJobBrief,
} from "@/lib/inspect/pre-job-brief";
import {
  hydrateInspectionFormData,
  type ClientInspectionFormData,
} from "@/lib/inspect/serialize-for-client";

const preJobBriefStorageKey = (inspectionId: string) =>
  `inspect-pre-job-brief-${inspectionId}`;

type InspectionFormShellProps = {
  inspectionId: string;
  serverInspection: ClientInspectionFormData | null;
  serverPreJobBrief?: ClientPreJobBrief | null;
  /** When omitted (offline shell), writes are allowed locally; server rejects sync if billing expired. */
  writeAccess?: boolean;
  billingMessage?: string;
  checkoutUrl?: string | null;
  inlineCheckoutReady?: boolean;
  designPartner?: boolean;
  role?: AppRole;
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
        on this device — checklist, photos, signature, and equipment pass/fail (if the register
        was loaded online).
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
  serverPreJobBrief = null,
  writeAccess = true,
  billingMessage = "Subscribe to continue using GetFlareflow.",
  checkoutUrl = null,
  inlineCheckoutReady = false,
  designPartner = false,
  role = "technician",
}: InspectionFormShellProps) {
  const [inspection, setInspection] = useState<InspectionFormData | null>(null);
  const [preJobBrief, setPreJobBrief] = useState<PreJobBrief | null>(null);
  const [ready, setReady] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const serverRef = useRef<ClientInspectionFormData | null>(serverInspection);
  const briefRef = useRef<ClientPreJobBrief | null>(serverPreJobBrief);
  if (serverInspection) serverRef.current = serverInspection;
  if (serverPreJobBrief) briefRef.current = serverPreJobBrief;

  const bootstrap = useCallback(async () => {
    const cachedRow = await getInspectionSnapshot(inspectionId);
    const cached = cachedRow ? parseInspectionSnapshot(cachedRow.snapshot) : null;
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const server = serverRef.current ? hydrateInspectionFormData(serverRef.current) : null;
    const resolved = preferOfflineInspection(server, cached, offline);

    if (resolved) {
      setInspection(resolved);
      setOfflineOnly(offline && !server);

      let brief: ReturnType<typeof hydratePreJobBrief> | null = null;
      if (briefRef.current) {
        brief = hydratePreJobBrief(briefRef.current);
        try {
          sessionStorage.setItem(
            preJobBriefStorageKey(inspectionId),
            JSON.stringify(briefRef.current),
          );
        } catch {
          /* quota */
        }
      } else {
        try {
          const raw = sessionStorage.getItem(preJobBriefStorageKey(inspectionId));
          if (raw) brief = hydratePreJobBrief(JSON.parse(raw) as ClientPreJobBrief);
        } catch {
          /* ignore */
        }
      }
      setPreJobBrief(brief);

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
    if (navigator.onLine) {
      void warmUrlForOffline("/inspect/offline");
    }

    const label = buildingLabel(inspection.building);
    const subtitle = `${inspection.building.customer.name} · ${inspection.inspectionType.name}`;
    const entry = {
      inspectionId,
      label,
      subtitle,
      scheduledAt: new Date(inspection.scheduledAt).toISOString(),
    };
    const catalog = getJobCatalog().filter((row) => row.inspectionId !== inspectionId);
    saveJobCatalog([entry, ...catalog]);
  }, [ready, inspection, inspectionId]);

  if (!ready) return <InspectionFormSkeleton />;
  if (!inspection) return <OfflineInspectionUnavailable inspectionId={inspectionId} />;

  return (
    <InspectionForm
      key={`${inspection.id}-${offlineOnly ? "offline" : "online"}`}
      inspection={inspection}
      offlineOnly={offlineOnly}
      writeAccess={writeAccess}
      billingMessage={billingMessage}
      checkoutUrl={checkoutUrl}
      inlineCheckoutReady={inlineCheckoutReady}
      designPartner={designPartner}
      role={role}
      preJobBrief={preJobBrief}
    />
  );
}
