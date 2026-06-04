import { UserButton } from "@clerk/nextjs";
import { StaffNotificationBell } from "@/components/dashboard/staff-notification-bell";
import type { DashboardSession } from "@/lib/dashboard/session";
import type { StaffNotificationsFeed } from "@/lib/notifications/queries";

type DashboardHeaderActionsProps = {
  session: DashboardSession;
  notificationFeed?: StaffNotificationsFeed | null;
};

export function DashboardHeaderActions({
  session,
  notificationFeed = null,
}: DashboardHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {notificationFeed ? (
        <StaffNotificationBell
          feed={notificationFeed}
          role={session.role}
          variant="dashboard"
        />
      ) : null}
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
