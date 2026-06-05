import { WorkOrderStatus } from "@prisma/client";

export const WORK_ORDER_STATUSES: { value: WorkOrderStatus; label: string }[] = [
  { value: WorkOrderStatus.draft, label: "Draft" },
  { value: WorkOrderStatus.scheduled, label: "Scheduled" },
  { value: WorkOrderStatus.in_progress, label: "In progress" },
  { value: WorkOrderStatus.completed, label: "Completed" },
  { value: WorkOrderStatus.cancelled, label: "Cancelled" },
];

export const OPEN_WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  WorkOrderStatus.draft,
  WorkOrderStatus.scheduled,
  WorkOrderStatus.in_progress,
];

export function workOrderStatusLabel(status: WorkOrderStatus): string {
  return WORK_ORDER_STATUSES.find((row) => row.value === status)?.label ?? status;
}
