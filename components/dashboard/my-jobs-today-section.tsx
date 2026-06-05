import { MyJobSiteActions } from "@/components/dashboard/my-job-site-actions";
import { Card, CardContent } from "@/components/ui/card";
import { InspectJobLink } from "@/components/inspect/inspect-job-link";
import { formatDateTime } from "@/lib/dashboard/dates";
import type { JobCatalogEntry } from "@/lib/offline/job-catalog";
import { cn } from "@/lib/utils";

type MyJobsTodaySectionProps = {
  jobs: JobCatalogEntry[];
  highlightId?: string | null;
};

export function MyJobsTodaySection({ jobs, highlightId }: MyJobsTodaySectionProps) {
  if (jobs.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="my-jobs-today-heading">
      <div>
        <h2 id="my-jobs-today-heading" className="text-base font-semibold text-foreground">
          Today
        </h2>
        <p className="text-sm text-muted-foreground">
          {jobs.length === 1
            ? "1 visit scheduled for today — open the checklist or get directions below."
            : `${jobs.length} visits scheduled for today — open a job or get directions.`}
        </p>
      </div>

      <ul className="space-y-3">
        {jobs.map((job) => {
          const inProgress = job.status === "in_progress";
          const isPromoted = job.inspectionId === highlightId;
          return (
            <li key={job.inspectionId}>
              <Card
                className={cn(
                  "overflow-hidden border-primary/30",
                  inProgress && "border-primary/50 bg-primary/5",
                  isPromoted && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
                )}
              >
                <InspectJobLink
                  inspectionId={job.inspectionId}
                  className="block transition-opacity hover:opacity-95"
                >
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{job.label}</span>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        Today
                      </span>
                      {inProgress ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                          In progress
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1 block text-sm text-muted-foreground">{job.subtitle}</span>
                    {job.addressLine ? (
                      <span className="mt-2 block text-sm text-foreground">{job.addressLine}</span>
                    ) : null}
                    <span className="mt-2 block text-sm font-medium text-primary">
                      {formatDateTime(job.scheduledAt)}
                    </span>
                  </CardContent>
                </InspectJobLink>
                <MyJobSiteActions mapsQuery={job.mapsQuery} addressLine={job.addressLine} />
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
