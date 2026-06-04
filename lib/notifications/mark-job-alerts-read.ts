"use server";

import { revalidatePath } from "next/cache";
import { getDashboardSession } from "@/lib/dashboard/session";
import { JOB_ALERT_NOTIFICATION_TYPES } from "@/lib/notifications/job-alerts";
import { prisma } from "@/lib/prisma";

/** Clear unread job alerts when a technician opens the related inspection. */
export async function markJobAlertsReadForInspection(
  inspectionId: string,
): Promise<void> {
  const session = await getDashboardSession();
  if (!session || session.role !== "technician") return;

  const trimmed = inspectionId.trim();
  if (!trimmed) return;

  try {
    const unread = await prisma.staffNotification.findMany({
      where: {
        companyId: session.companyId,
        targetUserId: session.appUserId,
        entityType: "inspection",
        entityId: trimmed,
        type: { in: [...JOB_ALERT_NOTIFICATION_TYPES] },
        reads: { none: { userId: session.appUserId } },
      },
      select: { id: true },
      take: 20,
    });

    if (unread.length === 0) return;

    await prisma.staffNotificationRead.createMany({
      data: unread.map((row) => ({
        notificationId: row.id,
        userId: session.appUserId,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/inspect", "layout");
  } catch (error) {
    console.error("markJobAlertsReadForInspection failed", error, { inspectionId });
  }
}
