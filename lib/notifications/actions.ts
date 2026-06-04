"use server";

import { revalidatePath } from "next/cache";
import { canViewStaffNotifications } from "@/lib/notifications/scope";
import { staffNotificationWhereForUser } from "@/lib/notifications/scope";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export type StaffNotificationActionState =
  | { ok: true }
  | { ok: false; error: string };

const notificationIdSchema = z.object({
  notificationId: z.string().cuid(),
});

async function guardSession() {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false as const, error: "You must be signed in." };
  }
  if (!canViewStaffNotifications(session.role)) {
    return { ok: false as const, error: "Notifications are not available for your role." };
  }
  return { ok: true as const, session };
}

export async function markStaffNotificationRead(
  notificationId: string,
): Promise<StaffNotificationActionState> {
  const guard = await guardSession();
  if (!guard.ok) return guard;

  const parsed = notificationIdSchema.safeParse({ notificationId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification." };
  }

  const where = staffNotificationWhereForUser({
    companyId: guard.session.companyId,
    appUserId: guard.session.appUserId,
    role: guard.session.role,
  });

  try {
    const notification = await prisma.staffNotification.findFirst({
      where: { ...where, id: parsed.data.notificationId },
      select: { id: true },
    });
    if (!notification) {
      return { ok: false, error: "Notification not found." };
    }

    await prisma.staffNotificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId: notification.id,
          userId: guard.session.appUserId,
        },
      },
      create: {
        notificationId: notification.id,
        userId: guard.session.appUserId,
      },
      update: { readAt: new Date() },
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (error) {
    captureServerActionError("markStaffNotificationRead", error);
    return { ok: false, error: "Could not update notification." };
  }
}

export async function markAllStaffNotificationsRead(): Promise<StaffNotificationActionState> {
  const guard = await guardSession();
  if (!guard.ok) return guard;

  const where = staffNotificationWhereForUser({
    companyId: guard.session.companyId,
    appUserId: guard.session.appUserId,
    role: guard.session.role,
  });

  try {
    const unread = await prisma.staffNotification.findMany({
      where: {
        ...where,
        reads: { none: { userId: guard.session.appUserId } },
      },
      select: { id: true },
      take: 100,
    });

    if (unread.length > 0) {
      await prisma.staffNotificationRead.createMany({
        data: unread.map((row) => ({
          notificationId: row.id,
          userId: guard.session.appUserId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (error) {
    captureServerActionError("markAllStaffNotificationsRead", error);
    return { ok: false, error: "Could not clear notifications." };
  }
}
