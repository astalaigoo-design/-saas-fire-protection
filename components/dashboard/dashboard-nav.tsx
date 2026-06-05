"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Receipt,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavIcon =
  | "layout-dashboard"
  | "activity"
  | "users"
  | "building"
  | "clipboard-list"
  | "calendar"
  | "file-text"
  | "receipt"
  | "wrench"
  | "package"
  | "credit-card"
  | "settings";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
};

type DashboardNavProps = {
  items: DashboardNavItem[];
  className?: string;
  /** Unread counts keyed by nav href (e.g. My jobs for technicians). */
  badges?: Record<string, number>;
};

const navIcons: Record<DashboardNavIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  activity: Activity,
  users: Users,
  building: Building2,
  "clipboard-list": ClipboardList,
  calendar: Calendar,
  "file-text": FileText,
  receipt: Receipt,
  wrench: Wrench,
  package: Package,
  "credit-card": CreditCard,
  settings: Settings,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavBadge({ count }: { count: number }) {
  return (
    <span
      className="ml-auto flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-none text-destructive-foreground"
      aria-hidden
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function DashboardNav({ items, className, badges }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Dashboard">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = navIcons[item.icon];
        const badge = badges?.[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
            {badge > 0 ? <NavBadge count={badge} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact horizontal nav for small screens. */
export function DashboardNavMobile({ items, badges }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Dashboard"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = navIcons[item.icon];
        const badge = badges?.[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
            {badge > 0 ? <NavBadge count={badge} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
