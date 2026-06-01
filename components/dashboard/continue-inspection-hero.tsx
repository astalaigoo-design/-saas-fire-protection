"use client";

import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { InspectJobLink } from "@/components/inspect/inspect-job-link";
import { pickPromotedResumeJobId } from "@/lib/inspect/resume-job";
import { getActiveInspectionId } from "@/lib/offline/active-inspection";
import { hardNavigate, shouldHardNavigateOffline } from "@/lib/offline/hard-navigate";
import { listInspectionSnapshots } from "@/lib/offline/indexeddb";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";
import { parseInspectionSnapshot } from "@/lib/offline/inspection-snapshot";
import type { JobCatalogEntry } from "@/lib/offline/job-catalog";
import { buildingLabel } from "@/lib/customers/format";
import { cn } from "@/lib/utils";

type OfflineResumeJob = {
  inspectionId: string;
  label: string;
  subtitle: string;
};

type ContinueInspectionHeroProps = {
  jobs: JobCatalogEntry[];
  /** Server-picked resume target (in-progress assignments). */
  serverResumeJobId: string | null;
};

export function ContinueInspectionHero({
  jobs,
  serverResumeJobId,
}: ContinueInspectionHeroProps) {
  const [offline, setOffline] = useState(false);
  const [offlineOnlyJobs, setOfflineOnlyJobs] = useState<OfflineResumeJob[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const syncActiveId = () => setActiveId(getActiveInspectionId());

    const load = async () => {
      syncActiveId();
      const isOffline = !navigator.onLine;
      setOffline(isOffline);

      if (!isOffline) {
        setOfflineOnlyJobs([]);
        return;
      }

      const rows = await listInspectionSnapshots();
      const fromSnapshots = rows
        .map((row) => {
          const snapshot = parseInspectionSnapshot(row.snapshot);
          if (!snapshot) return null;
          return {
            inspectionId: row.inspectionId,
            label: buildingLabel(snapshot.building),
            subtitle: `${snapshot.building.customer.name} · ${snapshot.inspectionType.name}`,
            updatedAt: row.updatedAt,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((a, b) => b.updatedAt - a.updatedAt);

      const catalogIds = new Set(jobs.map((job) => job.inspectionId));
      const onlyOnDevice = fromSnapshots.filter(
        (row) => !catalogIds.has(row.inspectionId),
      );
      setOfflineOnlyJobs(
        onlyOnDevice.map(({ inspectionId, label, subtitle }) => ({
          inspectionId,
          label,
          subtitle,
        })),
      );
    };

    void load();
    window.addEventListener("online", load);
    window.addEventListener("offline", load);
    window.addEventListener("focus", syncActiveId);
    return () => {
      window.removeEventListener("online", load);
      window.removeEventListener("offline", load);
      window.removeEventListener("focus", syncActiveId);
    };
  }, [jobs]);

  const promotedId = useMemo(() => {
    const fromAssignments = pickPromotedResumeJobId(
      jobs.map((job) => ({
        inspectionId: job.inspectionId,
        status: job.status ?? "scheduled",
        scheduledAt: job.scheduledAt,
      })),
      activeId,
    );
    if (fromAssignments) return fromAssignments;
    if (serverResumeJobId) return serverResumeJobId;

    if (!offline) return null;

    const deviceIds = new Set([
      ...jobs.map((job) => job.inspectionId),
      ...offlineOnlyJobs.map((job) => job.inspectionId),
    ]);
    if (activeId && deviceIds.has(activeId)) return activeId;
    if (offlineOnlyJobs[0]) return offlineOnlyJobs[0].inspectionId;

    return null;
  }, [jobs, activeId, serverResumeJobId, offline, offlineOnlyJobs]);

  const primaryJob = useMemo(() => {
    if (!promotedId) return null;
    const assigned = jobs.find((job) => job.inspectionId === promotedId);
    if (assigned) return assigned;
    const deviceOnly = offlineOnlyJobs.find((job) => job.inspectionId === promotedId);
    if (deviceOnly) {
      return {
        inspectionId: deviceOnly.inspectionId,
        label: deviceOnly.label,
        subtitle: deviceOnly.subtitle,
        scheduledAt: "",
        status: "in_progress" as const,
      };
    }
    return null;
  }, [jobs, promotedId, offlineOnlyJobs]);

  const secondaryOfflineJobs = useMemo(() => {
    if (!promotedId) return offlineOnlyJobs;
    return offlineOnlyJobs.filter((job) => job.inspectionId !== promotedId);
  }, [offlineOnlyJobs, promotedId]);

  if (!primaryJob) return null;

  const isInProgress = primaryJob.status === "in_progress" || offline;
  const title = isInProgress ? "Continue inspection" : "Resume inspection";
  const description = offline
    ? "Pick up where you left off on this device."
    : isInProgress
      ? "You have an inspection in progress. Tap to open the checklist."
      : "Open your last inspection on this device.";

  const navigateOffline = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (shouldHardNavigateOffline()) {
      event.preventDefault();
      hardNavigate(href);
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border px-4 py-4 shadow-sm",
        isInProgress
          ? "border-primary/50 bg-primary/10"
          : "border-amber-500/40 bg-amber-500/10",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          isInProgress ? "text-primary" : "text-amber-600 dark:text-amber-300",
        )}
      >
        {offline ? "Offline" : isInProgress ? "In progress" : "Saved on device"}
      </p>
      <h2 className="mt-1 font-heading text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <p className="mt-2 font-medium text-foreground">{primaryJob.label}</p>
      <p className="text-sm text-muted-foreground">{primaryJob.subtitle}</p>

      <InspectJobLink
        inspectionId={primaryJob.inspectionId}
        className={cn(
          "mt-4 flex min-h-14 w-full items-center justify-center rounded-xl text-base font-bold shadow-md",
          isInProgress
            ? "bg-primary text-primary-foreground hover:opacity-95"
            : "bg-amber-500 text-slate-950 hover:bg-amber-400",
        )}
      >
        {title}
      </InspectJobLink>

      {secondaryOfflineJobs.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
          {secondaryOfflineJobs.map((job) => {
            const href = inspectOfflineHref(job.inspectionId);
            return (
              <li key={job.inspectionId}>
                <a
                  href={href}
                  onClick={(event) => navigateOffline(href, event)}
                  className="block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  {job.label}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
