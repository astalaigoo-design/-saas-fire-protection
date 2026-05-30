import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { RecentInspectionsTable } from "@/components/dashboard/recent-inspections-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingInspectionCard } from "@/components/dashboard/upcoming-inspection-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getDashboardStats,
  getRecentCompletedInspections,
  getUpcomingInspectionsThisWeek,
} from "@/lib/dashboard/queries";
import { getOnboardingProgress } from "@/lib/dashboard/onboarding";
import { getDashboardSession } from "@/lib/dashboard/session";
import { isSharedTenantCompany } from "@/lib/companies/shared-tenant";
import { canManageCustomers } from "@/lib/auth/permissions";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

export default async function DashboardPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const showOnboarding = canManageCustomers(session.role);

  const [stats, upcoming, completed, onboarding] = await Promise.all([
    getDashboardStats(session),
    getUpcomingInspectionsThisWeek(session),
    getRecentCompletedInspections(session),
    showOnboarding ? getOnboardingProgress(session) : Promise.resolve(null),
  ]);

  const workspaceName = isSharedTenantCompany({
    id: session.companyId,
    name: session.companyName,
  })
    ? `${session.companyName} (demo workspace)`
    : session.companyName;

  const description = [
    workspaceName,
    session.email ? session.email : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={description}
        actions={<DashboardActions role={session.role} />}
      />

      {onboarding ? <OnboardingChecklist progress={onboarding} /> : null}

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
          <h2 id="upcoming-heading" className="font-heading text-lg font-semibold text-foreground">
            Upcoming this week
          </h2>
          <Link
            href="/dashboard/jobs"
            className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}
          >
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No inspections scheduled this week"
            description="Schedule a visit from the calendar when you're ready."
          />
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
        <h2
          id="recent-heading"
          className="mb-4 font-heading text-lg font-semibold text-foreground"
        >
          Recently completed
        </h2>
        <RecentInspectionsTable inspections={completed} />
      </section>

      <section aria-label="Feedback" className="flex justify-end">
        <Link
          href="mailto:support@getflareflow.com?subject=GetFlareflow%20Dashboard%20Feedback"
          className={buttonVariants({ variant: "outline" })}
        >
          Feedback
        </Link>
      </section>
    </div>
  );
}
