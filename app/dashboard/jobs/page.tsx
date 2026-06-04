import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { InspectionCalendar } from "@/components/scheduling/inspection-calendar";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseCalendarMonth } from "@/lib/scheduling/calendar";
import { getCalendarInspections } from "@/lib/scheduling/queries";
import { cn } from "@/lib/utils";

type JobsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const month = parseCalendarMonth(searchParams);
  const inspections = await getCalendarInspections(session, month.year, month.month);
  const showScheduledBanner = searchParams.scheduled === "1";
  const showUpdatedBanner = searchParams.updated === "1";
  const showBulkBanner = searchParams.bulk === "1";
  const bulkMovedRaw = searchParams.moved;
  const bulkMovedCount =
    typeof bulkMovedRaw === "string" ? Math.max(0, Number.parseInt(bulkMovedRaw, 10) || 0) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Drag jobs between days, bulk-reschedule multiple visits, or open a job to change assignee and time. Technicians are notified on changes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/jobs/import"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
            >
              Import schedule
            </Link>
            <Link
              href="/dashboard/jobs/new"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
            >
              Schedule one job
            </Link>
          </div>
        }
      />
      <InspectionCalendar
        month={month}
        inspections={inspections}
        showScheduledBanner={showScheduledBanner}
        showUpdatedBanner={showUpdatedBanner}
        showBulkBanner={showBulkBanner}
        bulkMovedCount={bulkMovedCount}
        canEditJobs
      />
    </div>
  );
}
