import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Separator } from "@/components/ui/separator";
import { parseAppRoleFromMetadata } from "@/lib/auth/roles";
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/dashboard"
              className="shrink-0 font-heading text-sm font-semibold tracking-tight text-foreground"
            >
              Saas Fire Protection
            </Link>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <DashboardNav items={navItems} />
          </div>
          <div className="self-end sm:self-auto">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
