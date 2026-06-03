import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DASHBOARD_ROBOTS_METADATA } from "@/lib/seo/site-metadata";
import { BrandLogo } from "@/components/brand-logo";
import { BranchSwitcher } from "@/components/dashboard/branch-switcher";
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions";
import { DashboardNav, DashboardNavMobile } from "@/components/dashboard/dashboard-nav";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { getBranchSwitcherData } from "@/lib/branches/queries";
import { getCompanyBillingSnapshot } from "@/lib/billing/queries";
import { getDashboardNavItems } from "@/lib/dashboard/nav-items";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getTechnicianHomeHref } from "@/lib/inspect/resume-job";

export const metadata: Metadata = DASHBOARD_ROBOTS_METADATA;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  if (!session) {
    const { userId } = await auth();
    if (userId) redirect("/account-setup");
    redirect("/sign-in");
  }

  const [navItems, billing, branchSwitcher] = await Promise.all([
    Promise.resolve(getDashboardNavItems(session.role)),
    getCompanyBillingSnapshot(session, session.email),
    getBranchSwitcherData(session),
  ]);

  const homeHref =
    session.role === "technician" ? getTechnicianHomeHref() : "/dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex flex-col gap-6 p-4">
          <Link
            href={homeHref}
            className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BrandLogo logoClassName="size-9" />
          </Link>
          <DashboardNav items={navItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link
              href={homeHref}
              className="shrink-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BrandLogo logoClassName="size-9" />
            </Link>
            <div className="flex items-center gap-2">
              {branchSwitcher.canSwitch ? (
                <BranchSwitcher
                  branches={branchSwitcher.branches}
                  activeBranchId={branchSwitcher.activeBranchId}
                  label={branchSwitcher.label}
                />
              ) : null}
              <DashboardHeaderActions />
            </div>
          </div>
          <div className="px-4 pb-3">
            <DashboardNavMobile items={navItems} />
          </div>
        </header>

        <header className="sticky top-0 z-40 hidden border-b border-border bg-card/80 backdrop-blur-md lg:block">
          <div className="flex items-center justify-end gap-4 px-6 py-3">
            {branchSwitcher.canSwitch ? (
              <BranchSwitcher
                branches={branchSwitcher.branches}
                activeBranchId={branchSwitcher.activeBranchId}
                label={branchSwitcher.label}
              />
            ) : null}
            <DashboardHeaderActions />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">
          {billing ? <TrialBanner billing={billing} role={session.role} /> : null}
          {billing ? (
            <SubscriptionGate billing={billing} role={session.role}>
              {children}
            </SubscriptionGate>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
