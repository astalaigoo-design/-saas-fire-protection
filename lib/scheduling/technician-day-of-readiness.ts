import { InspectionStatus, UserRole } from "@prisma/client";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import { buildingLabel } from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { getDayOfSmsTimeZone, getZonedDayBounds } from "@/lib/scheduling/day-of-timezone";
import { isSmsConfigured } from "@/lib/sms/env";
import { prisma } from "@/lib/prisma";

export type TechnicianDayOfReadinessRow = {
  inspectionId: string;
  scheduledAt: Date;
  buildingLabel: string;
  technicianName: string;
};

export async function listTodayJobsMissingTechnicianPhone(
  session: DashboardSession,
  now = new Date(),
): Promise<TechnicianDayOfReadinessRow[]> {
  if (!isSmsConfigured()) return [];

  const scope = branchScopeFromSession(session);
  const { start, end } = getZonedDayBounds(now, getDayOfSmsTimeZone());

  const rows = await prisma.inspection.findMany({
    where: {
      ...inspectionWhereFromScope(scope, session.companyId),
      scheduledAt: { gte: start, lt: end },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      assignedToUserId: { not: null },
      assignedTo: {
        role: UserRole.technician,
        active: true,
        OR: [{ phone: null }, { phone: "" }],
      },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      building: { select: { name: true, addressLine1: true, city: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    inspectionId: row.id,
    scheduledAt: row.scheduledAt,
    buildingLabel: buildingLabel(row.building),
    technicianName: row.assignedTo?.name?.trim() || "Technician",
  }));
}
