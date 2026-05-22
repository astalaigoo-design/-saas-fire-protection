"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { setActiveInspectionId } from "@/lib/offline/active-inspection";
import { hardNavigate, shouldHardNavigateOffline } from "@/lib/offline/hard-navigate";
import { listInspectionSnapshots } from "@/lib/offline/indexeddb";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";
import { parseInspectionSnapshot } from "@/lib/offline/inspection-snapshot";
import { buildingLabel } from "@/lib/customers/format";

type OfflineJob = {
  inspectionId: string;
  label: string;
};

export function ResumeActiveInspection() {
  const [jobs, setJobs] = useState<OfflineJob[]>([]);

  useEffect(() => {
    const load = async () => {
      if (navigator.onLine) {
        setJobs([]);
        return;
      }

      const rows = await listInspectionSnapshots();
      const next = rows
        .map((row) => {
          const snapshot = parseInspectionSnapshot(row.snapshot);
          if (!snapshot) return null;
          return {
            inspectionId: row.inspectionId,
            label: buildingLabel(snapshot.building),
          };
        })
        .filter((row): row is OfflineJob => row !== null);

      setJobs(next);
      if (next[0]) setActiveInspectionId(next[0].inspectionId);
    };

    const onOffline = () => void load();
    const onOnline = () => setJobs([]);

    void load();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (jobs.length === 0) return null;

  const navigate = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (shouldHardNavigateOffline()) {
      event.preventDefault();
      hardNavigate(href);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-medium text-amber-200">You are offline</p>
      <p className="mt-1 text-sm text-amber-200/80">
        {jobs.length === 1
          ? "Resume your saved inspection on this device."
          : `${jobs.length} inspections saved on this device. Pick one to continue.`}
      </p>
      <ul className="mt-3 space-y-2">
        {jobs.map((job) => {
          const href = inspectOfflineHref(job.inspectionId);
          return (
            <li key={job.inspectionId}>
              <Link
                href={href}
                onClick={(event) => navigate(href, event)}
                className="flex min-h-11 items-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-slate-950"
              >
                {job.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
