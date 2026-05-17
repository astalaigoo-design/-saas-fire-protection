import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { RecentInspectionsTable } from "@/components/dashboard/recent-inspections-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingInspectionCard } from "@/components/dashboard/upcoming-inspection-card";
import {
  getDashboardStats,
  getRecentCompletedInspections,
  getUpcomingInspectionsThisWeek,
} from "@/lib/dashboard/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function DashboardPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const [stats, upcoming, completed] = await Promise.all([
    getDashboardStats(session),
    getUpcomingInspectionsThisWeek(session),
    getRecentCompletedInspections(session),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">
            {session.companyName}
            {session.email ? (
              <span className="text-slate-500"> · {session.email}</span>
            ) : null}
          </p>
        </div>
        <DashboardActions role={session.role} />
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Quick stats
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Customers" value={stats.customerCount} />
          <StatCard label="Buildings" value={stats.buildingCount} />
          <StatCard label="Inspections this month" value={stats.inspectionsThisMonth} />
        </div>
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="upcoming-heading" className="text-lg font-semibold text-white">
            Upcoming this week
          </h2>
          <Link href="/dashboard/jobs" className="text-sm text-amber-400 hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
            No inspections scheduled this week.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((inspection) => (
              <li key={inspection.id}>
                <UpcomingInspectionCard inspection={inspection} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-4 text-lg font-semibold text-white">
          Recently completed
        </h2>
        <RecentInspectionsTable inspections={completed} />
      </section>
    </div>
  );
}
