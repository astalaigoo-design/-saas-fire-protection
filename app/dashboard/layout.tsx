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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/dashboard" className="font-medium text-amber-400">
              Dashboard
            </Link>
            {canManageJobs(role) && (
              <Link
                href="/dashboard/jobs"
                className="text-slate-300 hover:text-white"
              >
                Jobs
              </Link>
            )}
            {role === "technician" && (
              <Link
                href="/dashboard/my-jobs"
                className="text-slate-300 hover:text-white"
              >
                My jobs
              </Link>
            )}
            {canManageCustomers(role) && (
              <Link
                href="/dashboard/customers"
                className="text-slate-300 hover:text-white"
              >
                Customers
              </Link>
            )}
            {canManageOrgSettings(role) && (
              <Link
                href="/dashboard/settings"
                className="text-slate-300 hover:text-white"
              >
                Org settings
              </Link>
            )}
          </nav>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
