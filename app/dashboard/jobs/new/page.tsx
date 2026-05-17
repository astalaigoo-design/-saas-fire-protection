import Link from "next/link";
import { redirect } from "next/navigation";
import { ScheduleInspectionForm } from "@/components/scheduling/schedule-inspection-form";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
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

  const formData = await getScheduleFormData(session.companyId);
  const defaultDate = resolveDefaultDate(searchParams);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/dashboard/jobs"
          className="inline-flex min-h-11 items-center text-sm font-medium text-amber-400 hover:underline"
        >
          ← Back to calendar
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Schedule inspection
          </h1>
          <p className="mt-1 text-slate-400">
            Assign a technician, choose a building and type, and set recurrence.
          </p>
        </div>
      </header>
      <ScheduleInspectionForm formData={formData} defaultDate={defaultDate} />
    </div>
  );
}
