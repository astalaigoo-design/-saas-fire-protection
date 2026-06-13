import type { DashboardSession } from "@/lib/dashboard/session";
import {
  canViewStaffNotifications,
  staffNotificationWhereForUser,
} from "@/lib/notifications/scope";
import { prisma } from "@/lib/prisma";

export type StaffNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: Date;
  read: boolean;
};

export type StaffNotificationsFeed = {
  unreadCount: number;
  items: StaffNotificationRow[];
};

const FEED_LIMIT = 12;

export async function getStaffNotificationsFeed(
  session: DashboardSession,
): Promise<StaffNotificationsFeed | null> {
  if (!canViewStaffNotifications(session.role)) {
    return null;
  }

  try {
    const where = staffNotificationWhereForUser({
      companyId: session.companyId,
      appUserId: session.appUserId,
      role: session.role,
    });

    const [rows, readRows] = await Promise.all([
      prisma.staffNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: FEED_LIMIT,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          href: true,
          createdAt: true,
        },
      }),
      prisma.staffNotificationRead.findMany({
        where: {
          userId: session.appUserId,
          notification: where,
        },
        select: { notificationId: true },
      }),
    ]);

    const readIds = new Set(readRows.map((row) => row.notificationId));

    const items: StaffNotificationRow[] = rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      createdAt: row.createdAt,
      read: readIds.has(row.id),
    }));

    const unreadCount = await prisma.staffNotification.count({
      where: {
        ...where,
        reads: { none: { userId: session.appUserId } },
      },
    });

    return { unreadCount, items };
  } catch (error) {
    console.error("getStaffNotificationsFeed failed", error);
    return null;
  }
}
