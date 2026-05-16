import { prisma } from "@/lib/prisma";

export async function getMyAssignedInspections(appUserId: string, companyId: string) {
  return prisma.inspection.findMany({
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
}
