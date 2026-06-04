import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export const JOB_ALERT_NOTIFICATION_TYPES = [
  "inspection.assigned",
  "inspection.rescheduled",
  "inspection.unassigned",
] as const;

export type JobAssignmentAlert = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: Date;
};

/** Unread assign/reschedule/unassigned notifications for the signed-in technician. */
export async function getUnreadJobAssignmentAlerts(
  session: DashboardSession,
): Promise<JobAssignmentAlert[]> {
  if (session.role !== "technician") return [];

  return prisma.staffNotification.findMany({
    where: {
      companyId: session.companyId,
      targetUserId: session.appUserId,
      type: { in: [...JOB_ALERT_NOTIFICATION_TYPES] },
      reads: { none: { userId: session.appUserId } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      createdAt: true,
    },
  });
}
