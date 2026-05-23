import { MyJobsClient } from "@/components/dashboard/my-jobs-client";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getMyAssignedInspections } from "@/lib/inspect/my-jobs";
import { CacheRouteOnVisit } from "@/components/offline/cache-route-on-visit";
import { ResumeActiveInspection } from "@/components/offline/resume-active-inspection";
import { buildingLabel } from "@/lib/customers/format";

export default async function MyJobsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "technician") redirect("/dashboard/jobs");

  const jobs = await getMyAssignedInspections(session.appUserId, session.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        description="Tap a job to open the mobile inspection form."
      />

      <CacheRouteOnVisit path="/dashboard/my-jobs" />
      <ResumeActiveInspection />

      <MyJobsClient
        serverJobs={jobs.map((job) => ({
          inspectionId: job.id,
          label: buildingLabel(job.building),
          subtitle: `${job.building.customer.name} · ${job.inspectionType.name}`,
          scheduledAt: job.scheduledAt.toISOString(),
        }))}
      />
    </div>
  );
}
