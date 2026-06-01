import { sortTechnicianJobs } from "@/lib/inspect/resume-job";
import { prisma } from "@/lib/prisma";

export async function getMyAssignedInspections(appUserId: string, companyId: string) {
  const rows = await prisma.inspection.findMany({
    where: {
      companyId,
      assignedToUserId: appUserId,
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
