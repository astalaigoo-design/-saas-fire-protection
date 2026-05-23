"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InspectJobLink } from "@/components/inspect/inspect-job-link";
import { getJobCatalog, saveJobCatalog, type JobCatalogEntry } from "@/lib/offline/job-catalog";
import { formatDateTime } from "@/lib/dashboard/dates";

type MyJobsClientProps = {
  serverJobs: JobCatalogEntry[];
};

export function MyJobsClient({ serverJobs }: MyJobsClientProps) {
  const [jobs, setJobs] = useState<JobCatalogEntry[]>(serverJobs);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (serverJobs.length > 0) {
      saveJobCatalog(serverJobs);
      setJobs(serverJobs);
    }
  }, [serverJobs]);

  useEffect(() => {
    const sync = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (isOffline) {
        const cached = getJobCatalog();
        if (cached.length > 0) setJobs(cached);
      } else if (serverJobs.length > 0) {
        setJobs(serverJobs);
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
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.inspectionId}>
            <InspectJobLink
              inspectionId={job.inspectionId}
              className="block rounded-xl transition-opacity hover:opacity-95"
            >
              <Card>
                <CardContent>
                  <span className="font-medium text-foreground">{job.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{job.subtitle}</span>
                  <span className="mt-2 block text-sm font-medium text-primary">
                    {formatDateTime(job.scheduledAt)}
                  </span>
                </CardContent>
              </Card>
            </InspectJobLink>
          </li>
        ))}
      </ul>
    </>
  );
}
