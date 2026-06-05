import { WorkOrderStatus } from "@prisma/client";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export function canTechnicianStartWorkOrder(status: WorkOrderStatus): boolean {
  return status === WorkOrderStatus.draft || status === WorkOrderStatus.scheduled;
}

export function canTechnicianCompleteWorkOrder(status: WorkOrderStatus): boolean {
  return status === WorkOrderStatus.in_progress;
}

export function isTechnicianWorkOrderEditable(status: WorkOrderStatus): boolean {
  return (
    status === WorkOrderStatus.draft ||
    status === WorkOrderStatus.scheduled ||
    status === WorkOrderStatus.in_progress
  );
}

export async function getTechnicianAssignedWorkOrder(
  session: DashboardSession,
  workOrderId: string,
) {
  if (session.role !== "technician") return null;

  return prisma.workOrder.findFirst({
    where: {
      id: workOrderId,
      companyId: session.companyId,
      assignedToUserId: session.appUserId,
    },
    select: {
      id: true,
      status: true,
      buildingId: true,
      building: { select: { id: true } },
    },
  });
}
