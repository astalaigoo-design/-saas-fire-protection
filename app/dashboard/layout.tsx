import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { parseAppRoleFromMetadata } from "@/lib/auth/roles";
import {
  canManageCustomers,
  canManageJobs,
  canManageOrgSettings,
} from "@/lib/auth/permissions";

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm sm:w-auto sm:flex-wrap sm:gap-4 sm:overflow-visible sm:pb-0">
            <Link
              href="/dashboard"
              className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-2 font-medium text-amber-400 hover:bg-slate-800/70"
            >
              Dashboard
            </Link>
            {canManageJobs(role) && (
              <Link
                href="/dashboard/jobs"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
              >
                Schedule
              </Link>
            )}
            {role === "technician" && (
              <Link
                href="/dashboard/my-jobs"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
              >
                My jobs
              </Link>
            )}
            {canManageCustomers(role) && (
              <Link
                href="/dashboard/customers"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
              >
                Customers
              </Link>
            )}
            {canManageOrgSettings(role) && (
              <Link
                href="/dashboard/settings"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
              >
                Org settings
              </Link>
            )}
          </nav>
          <div className="self-end sm:self-auto">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
