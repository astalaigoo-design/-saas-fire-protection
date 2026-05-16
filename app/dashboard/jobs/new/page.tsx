import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { ensureCanManageJobs } from "@/lib/auth/guards";

export default async function ScheduleInspectionPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Schedule inspection</h1>
      <p className="text-slate-400">
        Scheduling flow coming soon. View existing jobs on the jobs page.
      </p>
      <Link
        href="/dashboard/jobs"
        className="inline-flex min-h-11 items-center text-sm font-medium text-amber-400 hover:underline"
      >
        ← Back to jobs
      </Link>
    </div>
  );
}
