import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav, DashboardNavMobile } from "@/components/dashboard/dashboard-nav";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { getCompanyBillingSnapshot } from "@/lib/billing/queries";
import { getDashboardNavItems } from "@/lib/dashboard/nav-items";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const billing = await getCompanyBillingSnapshot(session, session.email);
  if (!billing) redirect("/sign-in");

  const navItems = getDashboardNavItems(session.role);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex flex-col gap-6 p-4">
          <Link
            href="/dashboard"
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
              href="/dashboard"
              className="shrink-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BrandLogo logoClassName="size-9" />
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
          <div className="px-4 pb-3">
            <DashboardNavMobile items={navItems} />
          </div>
        </header>

        <header className="sticky top-0 z-40 hidden border-b border-border bg-card/80 backdrop-blur-md lg:block">
          <div className="flex items-center justify-end px-6 py-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">
          <TrialBanner billing={billing} />
          <SubscriptionGate
            billing={{
              hasAccess: billing.hasAccess,
              message: billing.message,
              checkoutUrl: billing.checkoutUrl,
            }}
            role={session.role}
          >
            {children}
          </SubscriptionGate>
        </main>
      </div>
    </div>
  );
}
