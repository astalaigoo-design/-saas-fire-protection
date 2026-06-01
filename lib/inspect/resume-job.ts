export type TechnicianJobStatus = "scheduled" | "in_progress";

export function sortTechnicianJobs<
  T extends { status: string; scheduledAt: Date | string },
>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const rank = (status: string) => (status === "in_progress" ? 0 : 1);
    const byStatus = rank(a.status) - rank(b.status);
    if (byStatus !== 0) return byStatus;

    const at =
      typeof a.scheduledAt === "string"
        ? Date.parse(a.scheduledAt)
        : a.scheduledAt.getTime();
    const bt =
      typeof b.scheduledAt === "string"
        ? Date.parse(b.scheduledAt)
        : b.scheduledAt.getTime();
    return at - bt;
  });
}

/** Pick the inspection to promote for "Continue" (pass local active id on the client when known). */
export function pickPromotedResumeJobId<
  T extends { inspectionId: string; status: string; scheduledAt: Date | string },
>(jobs: T[], activeInspectionId: string | null): string | null {
  const sorted = sortTechnicianJobs(jobs);
  const inProgress = sorted.filter((job) => job.status === "in_progress");

  if (
    activeInspectionId &&
    inProgress.some((job) => job.inspectionId === activeInspectionId)
  ) {
    return activeInspectionId;
  }
  if (inProgress[0]) return inProgress[0].inspectionId;

  if (activeInspectionId && jobs.some((job) => job.inspectionId === activeInspectionId)) {
    return activeInspectionId;
  }

  return null;
}

export function getTechnicianHomeHref(): string {
  return "/dashboard/my-jobs";
}
