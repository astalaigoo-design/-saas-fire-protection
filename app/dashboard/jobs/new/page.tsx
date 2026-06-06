import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScheduleInspectionForm } from "@/components/scheduling/schedule-inspection-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getMarketConfig } from "@/lib/market/operating-market";
import {
  parseDateInputValue,
  toDateInputValue,
} from "@/lib/scheduling/calendar";
import { getScheduleFormData } from "@/lib/scheduling/queries";

type ScheduleInspectionPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function resolveDefaultDate(
  raw: Record<string, string | string[] | undefined>,
): string {
  const dateParam = raw.date;
  const value = typeof dateParam === "string" ? dateParam : undefined;
  const parsed = value ? parseDateInputValue(value) : null;
  if (parsed) return toDateInputValue(parsed);
  return toDateInputValue(new Date());
}

export default async function ScheduleInspectionPage({
  searchParams,
}: ScheduleInspectionPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const formData = await getScheduleFormData(session);
  const marketConfig = getMarketConfig(session.operatingMarket);
  const defaultDate = resolveDefaultDate(searchParams);
  const buildingIdParam = searchParams.buildingId;
  const defaultBuildingId =
    typeof buildingIdParam === "string" ? buildingIdParam : undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/jobs"
        className={cn(
          buttonVariants({ variant: "link", size: "sm" }),
          "mb-2 inline-flex min-h-11 p-0",
        )}
      >
        ← Back to calendar
      </Link>
      <PageHeader
        title="Schedule inspection"
        description="Assign a technician, choose a building and type, and set recurrence."
      />
      <ScheduleInspectionForm
        formData={formData}
        defaultDate={defaultDate}
        defaultBuildingId={defaultBuildingId}
        checklistHint={marketConfig.scheduleChecklistHint}
      />
    </div>
  );
}
