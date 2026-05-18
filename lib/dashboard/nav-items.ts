import {
  canManageCustomers,
  canManageJobs,
  canManageOrgSettings,
} from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-nav";

export function getDashboardNavItems(role: AppRole): DashboardNavItem[] {
  const items: DashboardNavItem[] = [{ href: "/dashboard", label: "Dashboard" }];

  if (canManageJobs(role)) {
    items.push({ href: "/dashboard/jobs", label: "Schedule" });
  }
  if (role === "technician") {
    items.push({ href: "/dashboard/my-jobs", label: "My jobs" });
  }
  if (canManageCustomers(role)) {
    items.push({ href: "/dashboard/customers", label: "Customers" });
  }
  if (canManageOrgSettings(role)) {
    items.push({ href: "/dashboard/settings", label: "Settings" });
  }

  return items;
}
