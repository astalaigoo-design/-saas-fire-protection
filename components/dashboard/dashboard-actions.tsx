import Link from "next/link";
import { canManageCustomers, canManageJobs } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardActionsProps = {
  role: AppRole;
};

export function DashboardActions({ role }: DashboardActionsProps) {
  const showCustomers = canManageCustomers(role);
  const showSchedule = canManageJobs(role);

  if (!showCustomers && !showSchedule) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {showCustomers && (
        <Link
          href="/dashboard/customers/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 bg-amber-500 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-400",
          )}
        >
          New Customer
        </Link>
      )}
      {showSchedule && (
        <Link
          href="/dashboard/jobs/new"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 border-slate-700 bg-slate-900/70 px-5 text-sm font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-800",
          )}
        >
          Schedule Inspection
        </Link>
      )}
    </div>
  );
}
