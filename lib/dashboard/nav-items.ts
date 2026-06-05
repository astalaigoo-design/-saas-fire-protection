import {
  canManageCustomers,
  canManageJobs,
  canManageOrgSettings,
  canViewBilling,
} from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-nav";
import { getTechnicianHomeHref } from "@/lib/inspect/resume-job";

export function getDashboardNavItems(role: AppRole): DashboardNavItem[] {
  if (role === "technician") {
    return [
      {
        href: getTechnicianHomeHref(),
        label: "My jobs",
        icon: "clipboard-list",
      },
    ];
  }

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
      { href: "/dashboard/operations", label: "Command center", icon: "activity" },
      { href: "/dashboard/inspections", label: "Inspections", icon: "clipboard-list" },
      { href: "/dashboard/jobs", label: "Calendar", icon: "calendar" },
      { href: "/dashboard/quotes", label: "Quotes", icon: "receipt" },
      { href: "/dashboard/work-orders", label: "Work orders", icon: "wrench" },
      { href: "/dashboard/parts", label: "Parts", icon: "package" },
      { href: "/dashboard/reports", label: "Reports", icon: "file-text" },
    );
  }

  if (canViewBilling(role)) {
    items.push({ href: "/dashboard/billing", label: "Billing", icon: "credit-card" });
  }

  if (canManageOrgSettings(role)) {
    items.push({ href: "/dashboard/settings", label: "Organization", icon: "settings" });
  }

  return items;
}
