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
          className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
        >
          New customer
        </Link>
      )}
      {showSchedule && (
        <Link
          href="/dashboard/jobs/new"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
        >
          Schedule inspection
        </Link>
      )}
    </div>
  );
}
