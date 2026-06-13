"use client";

import Link from "next/link";
import { StaffNotificationBell } from "@/components/dashboard/staff-notification-bell";
import type { AppRole } from "@/lib/auth/roles";
import type { StaffNotificationsFeed } from "@/lib/notifications/queries";
import { serializeStaffNotificationsFeed } from "@/lib/notifications/serialize-feed";
import { cn } from "@/lib/utils";

type InspectFieldHeaderBarProps = {
  feed: StaffNotificationsFeed;
  backHref: string;
  backLabel: string;
  role: AppRole;
};

export function InspectFieldHeaderBar({
  feed,
  backHref,
  backLabel,
  role,
}: InspectFieldHeaderBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-slate-800",
        "bg-slate-950/95 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur",
      )}
    >
      <Link
        href={backHref}
        className="inline-flex min-h-10 items-center text-sm font-medium text-slate-300 hover:text-white"
      >
        ← {backLabel}
      </Link>
      <StaffNotificationBell
        feed={serializeStaffNotificationsFeed(feed)}
        role={role}
        variant="field"
      />
    </div>
  );
}
