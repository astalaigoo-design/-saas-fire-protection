import { UserButton } from "@clerk/nextjs";
import { StaffNotificationBell } from "@/components/dashboard/staff-notification-bell";
import type { DashboardSession } from "@/lib/dashboard/session";
import type { ClientStaffNotificationsFeed } from "@/lib/notifications/serialize-feed";
import { serializeStaffNotificationsFeed } from "@/lib/notifications/serialize-feed";
import type { StaffNotificationsFeed } from "@/lib/notifications/queries";

type DashboardHeaderActionsProps = {
  session: DashboardSession;
  notificationFeed?: StaffNotificationsFeed | null;
};

function toClientFeed(
  feed: StaffNotificationsFeed,
): ClientStaffNotificationsFeed {
  return serializeStaffNotificationsFeed(feed);
}

export function DashboardHeaderActions({
  session,
  notificationFeed = null,
}: DashboardHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {notificationFeed ? (
        <StaffNotificationBell
          feed={toClientFeed(notificationFeed)}
          role={session.role}
          variant="dashboard"
        />
      ) : null}
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
