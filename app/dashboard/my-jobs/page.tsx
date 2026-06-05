import { MyJobsClient } from "@/components/dashboard/my-jobs-client";
import { MyJobsTodaySection } from "@/components/dashboard/my-jobs-today-section";
import { ContinueInspectionHero } from "@/components/dashboard/continue-inspection-hero";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDashboardSession } from "@/lib/dashboard/session";
import { MyJobsAlertsBanner } from "@/components/dashboard/my-jobs-alerts-banner";
import { MyJobsContactBanner } from "@/components/dashboard/my-jobs-contact-banner";
import { MyPhoneForm } from "@/components/dashboard/my-phone-form";
import { getOutboundEmailStatus } from "@/lib/email/env";
import { getSmsConfigStatus } from "@/lib/sms/env";
import { getUnreadJobAssignmentAlerts } from "@/lib/notifications/job-alerts";
import { prisma } from "@/lib/prisma";
import { pickPromotedResumeJobId } from "@/lib/inspect/resume-job";
import { CacheRouteOnVisit } from "@/components/offline/cache-route-on-visit";
import { MyWorkOrdersSection } from "@/components/dashboard/my-work-orders-section";
import { partitionTechnicianJobsByToday } from "@/lib/inspect/my-jobs-today";
import { getMyAssignedInspections, toJobCatalogEntry } from "@/lib/inspect/my-jobs";
import { listMyAssignedWorkOrders } from "@/lib/work-orders/queries";

export default async function MyJobsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "technician") redirect("/dashboard/jobs");

  const emailStatus = getOutboundEmailStatus();
  const [jobs, workOrders, jobAlerts, smsStatus, me] = await Promise.all([
    getMyAssignedInspections(session),
    listMyAssignedWorkOrders(session),
    getUnreadJobAssignmentAlerts(session),
    Promise.resolve(getSmsConfigStatus()),
    prisma.user.findUnique({
      where: { id: session.appUserId },
      select: { email: true, phone: true },
    }),
  ]);

  const catalogJobs = jobs.map(toJobCatalogEntry);
  const { todayJobs, upcomingJobs } = partitionTechnicianJobsByToday(catalogJobs);

  const serverResumeJobId = pickPromotedResumeJobId(
    catalogJobs.map((job) => ({ ...job, status: job.status ?? "scheduled" })),
    null,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        description={
          jobAlerts.length > 0
            ? "New assign or schedule updates below — also check the notification bell (top right)."
            : "Inspections use checklists below; assigned work orders let you start, note, and complete repairs on site."
        }
      />

      <MyJobsAlertsBanner alerts={jobAlerts} />

      <MyJobsContactBanner
        email={me?.email ?? session.email}
        outboundEmailConfigured={emailStatus.configured}
      />

      <MyPhoneForm
        currentPhone={me?.phone ?? null}
        smsConfigured={smsStatus.configured}
        hasJobsToday={todayJobs.length > 0}
      />

      <CacheRouteOnVisit path="/dashboard/my-jobs" />
      <ContinueInspectionHero jobs={catalogJobs} serverResumeJobId={serverResumeJobId} />

      <MyWorkOrdersSection workOrders={workOrders} />

      <MyJobsTodaySection jobs={todayJobs} highlightId={serverResumeJobId} />

      <MyJobsClient
        serverJobs={catalogJobs}
        upcomingJobs={upcomingJobs}
        promotedJobId={serverResumeJobId}
      />
    </div>
  );
}
