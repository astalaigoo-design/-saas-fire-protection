"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { getActiveInspectionId } from "@/lib/offline/active-inspection";
import { hardNavigate, shouldHardNavigateOffline } from "@/lib/offline/hard-navigate";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";

export function ResumeActiveInspection() {
  const [inspectionId, setInspectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.onLine) {
      setInspectionId(getActiveInspectionId());
    }

    const onOffline = () => setInspectionId(getActiveInspectionId());
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, []);

  if (!inspectionId) return null;

  const href = inspectOfflineHref(inspectionId);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (shouldHardNavigateOffline()) {
      event.preventDefault();
      hardNavigate(href);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-medium text-amber-200">You are offline</p>
      <p className="mt-1 text-sm text-amber-200/80">
        Resume your in-progress inspection on this device.
      </p>
      <Link
        href={href}
        onClick={handleClick}
        className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-slate-950"
      >
        Resume inspection
      </Link>
    </div>
  );
}
