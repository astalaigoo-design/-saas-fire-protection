import {
  canManageCustomers,
  canManageJobs,
  canManageOrgSettings,
} from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-nav";

export function getDashboardNavItems(role: AppRole): DashboardNavItem[] {
  const items: DashboardNavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  ];

  if (canManageCustomers(role)) {
    items.push(
      { href: "/dashboard/customers", label: "Customers", icon: "users" },
      { href: "/dashboard/buildings", label: "Buildings", icon: "building" },
    );
  }

  if (canManageJobs(role)) {
    items.push(
      { href: "/dashboard/inspections", label: "Inspections", icon: "clipboard-list" },
      { href: "/dashboard/jobs", label: "Calendar", icon: "calendar" },
      { href: "/dashboard/reports", label: "Reports", icon: "file-text" },
    );
  } else if (role === "technician") {
    items.push(
      { href: "/dashboard/my-jobs", label: "Inspections", icon: "clipboard-list" },
    );
  }

  if (canManageOrgSettings(role)) {
    items.push({ href: "/dashboard/settings", label: "Organization", icon: "settings" });
  }

  return items;
}
