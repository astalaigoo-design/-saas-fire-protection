import { MyJobsClient } from "@/components/dashboard/my-jobs-client";
import { ContinueInspectionHero } from "@/components/dashboard/continue-inspection-hero";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDashboardSession } from "@/lib/dashboard/session";
import { MyJobsAlertsBanner } from "@/components/dashboard/my-jobs-alerts-banner";
import { MyJobsContactBanner } from "@/components/dashboard/my-jobs-contact-banner";
import { MyPhoneForm } from "@/components/dashboard/my-phone-form";
import { getOutboundEmailStatus } from "@/lib/email/env";
import { getSmsConfigStatus } from "@/lib/sms/env";
import { getMyAssignedInspections } from "@/lib/inspect/my-jobs";
import { getUnreadJobAssignmentAlerts } from "@/lib/notifications/job-alerts";
import { prisma } from "@/lib/prisma";
import { pickPromotedResumeJobId } from "@/lib/inspect/resume-job";
import { CacheRouteOnVisit } from "@/components/offline/cache-route-on-visit";
import { buildingLabel } from "@/lib/customers/format";

export default async function MyJobsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "technician") redirect("/dashboard/jobs");

  const emailStatus = getOutboundEmailStatus();
  const [jobs, jobAlerts, smsStatus, me] = await Promise.all([
    getMyAssignedInspections(session),
    getUnreadJobAssignmentAlerts(session),
    Promise.resolve(getSmsConfigStatus()),
    prisma.user.findUnique({
      where: { id: session.appUserId },
      select: { email: true, phone: true },
    }),
  ]);

  const catalogJobs = jobs.map((job) => ({
    inspectionId: job.id,
    label: buildingLabel(job.building),
    subtitle: `${job.building.customer.name} · ${job.inspectionType.name}`,
    scheduledAt: job.scheduledAt.toISOString(),
    status: job.status as "scheduled" | "in_progress",
  }));

  const serverResumeJobId = pickPromotedResumeJobId(catalogJobs, null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        description="Continue an in-progress inspection or pick a job below."
      />

      <MyJobsAlertsBanner alerts={jobAlerts} />

      <MyJobsContactBanner
        email={me?.email ?? session.email}
        outboundEmailConfigured={emailStatus.configured}
      />

      <MyPhoneForm currentPhone={me?.phone ?? null} smsConfigured={smsStatus.configured} />

      <CacheRouteOnVisit path="/dashboard/my-jobs" />
      <ContinueInspectionHero jobs={catalogJobs} serverResumeJobId={serverResumeJobId} />

      <MyJobsClient serverJobs={catalogJobs} promotedJobId={serverResumeJobId} />
    </div>
  );
}
