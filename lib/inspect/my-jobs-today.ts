import type { JobCatalogEntry } from "@/lib/offline/job-catalog";
import {
  getDayOfSmsTimeZone,
  isScheduledOnZonedDay,
} from "@/lib/scheduling/day-of-timezone";

export function partitionTechnicianJobsByToday(
  jobs: JobCatalogEntry[],
  reference = new Date(),
  timeZone = getDayOfSmsTimeZone(),
): { todayJobs: JobCatalogEntry[]; upcomingJobs: JobCatalogEntry[] } {
  const todayJobs: JobCatalogEntry[] = [];
  const upcomingJobs: JobCatalogEntry[] = [];

  for (const job of jobs) {
    const scheduledAt = new Date(job.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      upcomingJobs.push(job);
      continue;
    }
    if (isScheduledOnZonedDay(scheduledAt, reference, timeZone)) {
      todayJobs.push(job);
    } else {
      upcomingJobs.push(job);
    }
  }

  return { todayJobs, upcomingJobs };
}
