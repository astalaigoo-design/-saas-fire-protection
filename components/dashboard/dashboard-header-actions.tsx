import { UserButton } from "@clerk/nextjs";
import { StaffNotificationBell } from "@/components/dashboard/staff-notification-bell";
import type { DashboardSession } from "@/lib/dashboard/session";
import { canViewStaffNotifications } from "@/lib/notifications/scope";
import { getStaffNotificationsFeed } from "@/lib/notifications/queries";

type DashboardHeaderActionsProps = {
  session: DashboardSession;
};

export async function DashboardHeaderActions({ session }: DashboardHeaderActionsProps) {
  const feed = canViewStaffNotifications(session.role)
    ? await getStaffNotificationsFeed(session)
    : null;

  return (
    <div className="flex items-center gap-2">
      {feed ? <StaffNotificationBell feed={feed} /> : null}
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
