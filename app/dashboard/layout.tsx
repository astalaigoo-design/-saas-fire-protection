import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardNav, DashboardNavMobile } from "@/components/dashboard/dashboard-nav";
import { parseAppRoleFromMetadata } from "@/lib/auth/roles";
import { APP_NAME } from "@/lib/branding";
import { getDashboardNavItems } from "@/lib/dashboard/nav-items";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = parseAppRoleFromMetadata(
    user.publicMetadata as Record<string, unknown>,
    user.unsafeMetadata as Record<string, unknown> | undefined,
  );
  if (!role) redirect("/sign-in");

  const navItems = getDashboardNavItems(role);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex flex-col gap-6 p-4">
          <Link
            href="/dashboard"
            className="font-heading text-sm font-semibold tracking-tight text-foreground"
          >
            {APP_NAME}
          </Link>
          <DashboardNav items={navItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/dashboard"
              className="shrink-0 font-heading text-sm font-semibold tracking-tight text-foreground"
            >
              {APP_NAME}
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
