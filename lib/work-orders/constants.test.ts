import { WorkOrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { OPEN_WORK_ORDER_STATUSES, workOrderStatusLabel } from "@/lib/work-orders/constants";

describe("work order constants", () => {
  it("labels statuses", () => {
    expect(workOrderStatusLabel(WorkOrderStatus.in_progress)).toBe("In progress");
  });

  it("defines open statuses", () => {
    expect(OPEN_WORK_ORDER_STATUSES).toContain(WorkOrderStatus.draft);
    expect(OPEN_WORK_ORDER_STATUSES).not.toContain(WorkOrderStatus.completed);
  });
});
