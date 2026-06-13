import type { StaffNotificationsFeed, StaffNotificationRow } from "@/lib/notifications/queries";

/** JSON-safe notification feed for Server → Client boundaries. */
export type ClientStaffNotificationRow = Omit<StaffNotificationRow, "createdAt"> & {
  createdAt: string;
};

export type ClientStaffNotificationsFeed = {
  unreadCount: number;
  items: ClientStaffNotificationRow[];
};

export function serializeStaffNotificationsFeed(
  feed: StaffNotificationsFeed,
): ClientStaffNotificationsFeed {
  return {
    unreadCount: feed.unreadCount,
    items: feed.items.map((item) => ({
      ...item,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : typeof item.createdAt === "string"
            ? item.createdAt
            : new Date(item.createdAt as string).toISOString(),
    })),
  };
}

export function parseNotificationCreatedAt(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}
