"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InspectJobLink } from "@/components/inspect/inspect-job-link";
import { sortTechnicianJobs, type TechnicianJobStatus } from "@/lib/inspect/resume-job";
import { getActiveInspectionId } from "@/lib/offline/active-inspection";
import { getJobCatalog, saveJobCatalog, type JobCatalogEntry } from "@/lib/offline/job-catalog";
import { formatDateTime } from "@/lib/dashboard/dates";
import { cn } from "@/lib/utils";

type MyJobsClientProps = {
  serverJobs: JobCatalogEntry[];
  promotedJobId: string | null;
};

function jobForSort(job: JobCatalogEntry) {
  return {
    ...job,
    status: (job.status ?? "scheduled") as TechnicianJobStatus,
    scheduledAt: job.scheduledAt,
  };
}

export function MyJobsClient({ serverJobs, promotedJobId }: MyJobsClientProps) {
  const [jobs, setJobs] = useState<JobCatalogEntry[]>(serverJobs);
  const [offline, setOffline] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const syncActiveId = () => setActiveId(getActiveInspectionId());
    syncActiveId();
    window.addEventListener("focus", syncActiveId);
    return () => window.removeEventListener("focus", syncActiveId);
  }, []);

  useEffect(() => {
    if (serverJobs.length > 0) {
      saveJobCatalog(serverJobs);
      setJobs(sortTechnicianJobs(serverJobs));
    }
  }, [serverJobs]);

  useEffect(() => {
    const sync = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (isOffline) {
        const cached = getJobCatalog();
        if (cached.length > 0) {
          setJobs(sortTechnicianJobs(cached.map(jobForSort)));
        }
      } else if (serverJobs.length > 0) {
        setJobs(sortTechnicianJobs(serverJobs.map(jobForSort)));
      }
    };

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [serverJobs]);

  const highlightId = promotedJobId ?? activeId;

  const listJobs = useMemo(() => {
    if (!highlightId) return jobs;
    const promoted = jobs.find((job) => job.inspectionId === highlightId);
    if (!promoted) return jobs;
    return [
      promoted,
      ...jobs.filter((job) => job.inspectionId !== highlightId),
    ];
  }, [jobs, highlightId]);

  if (jobs.length === 0) {
    return (
      <EmptyState
        title={offline ? "No jobs saved on this device" : "No assigned inspections right now"}
        description={
          offline
            ? "Connect once, open My Jobs, then open each inspection you need before going offline again."
            : undefined
        }
      />
    );
  }

  return (
    <>
      {offline ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Offline: showing jobs saved on this device. Tap a job to continue the inspection.
        </p>
      ) : null}

      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">All assigned jobs</h2>
        <p className="text-xs text-muted-foreground">
          {offline
            ? "Saved for offline access on this device."
            : "Scheduled and in-progress inspections assigned to you."}
        </p>
      </div>

      <ul className="space-y-3">
        {listJobs.map((job) => {
          const isPromoted = job.inspectionId === highlightId;
          const inProgress = job.status === "in_progress";
          return (
            <li key={job.inspectionId}>
              <InspectJobLink
                inspectionId={job.inspectionId}
                className={cn(
                  "block rounded-xl transition-opacity hover:opacity-95",
                  isPromoted && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
                )}
              >
                <Card
                  className={cn(
                    inProgress && "border-primary/40 bg-primary/5",
                    isPromoted && !inProgress && "border-amber-500/30",
                  )}
                >
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{job.label}</span>
                      {inProgress ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                          In progress
                        </span>
                      ) : null}
                      {isPromoted && !inProgress ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Continue here
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {job.subtitle}
                    </span>
                    <span className="mt-2 block text-sm font-medium text-primary">
                      {formatDateTime(job.scheduledAt)}
                    </span>
                  </CardContent>
                </Card>
              </InspectJobLink>
            </li>
          );
        })}
      </ul>
    </>
  );
}
