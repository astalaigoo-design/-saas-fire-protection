import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { sortTechnicianJobs } from "@/lib/inspect/resume-job";
import { prisma } from "@/lib/prisma";

export async function getMyAssignedInspections(session: DashboardSession) {
  const scope = branchScopeFromSession(session);
  const rows = await prisma.inspection.findMany({
    where: {
      ...inspectionWhereFromScope(scope, session.companyId),
      assignedToUserId: session.appUserId,
      status: { in: ["scheduled", "in_progress"] },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      building: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true } },
        },
      },
      inspectionType: { select: { name: true } },
    },
  });

  return sortTechnicianJobs(rows);
}
