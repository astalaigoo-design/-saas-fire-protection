import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { InspectionCalendar } from "@/components/scheduling/inspection-calendar";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseCalendarMonth } from "@/lib/scheduling/calendar";
import { getCalendarInspections } from "@/lib/scheduling/queries";

type JobsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const month = parseCalendarMonth(searchParams);
  const inspections = await getCalendarInspections(
    session.companyId,
    month.year,
    month.month,
  );
  const showScheduledBanner = searchParams.scheduled === "1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Inspection calendar for your company. Click a date to schedule."
      />
      <InspectionCalendar
        month={month}
        inspections={inspections}
        showScheduledBanner={showScheduledBanner}
      />
    </div>
  );
}
