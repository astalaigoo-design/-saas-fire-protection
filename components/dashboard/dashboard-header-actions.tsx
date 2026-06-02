import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { canViewBilling } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardHeaderActionsProps = {
  role: AppRole;
};

export function DashboardHeaderActions({ role }: DashboardHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {canViewBilling(role) ? (
        <Link
          href="/dashboard/billing"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10 shrink-0")}
        >
          Billing
        </Link>
      ) : null}
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
