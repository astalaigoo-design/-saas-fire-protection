import { WorkOrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canTechnicianCompleteWorkOrder,
  canTechnicianStartWorkOrder,
  isTechnicianWorkOrderEditable,
} from "@/lib/work-orders/technician-access";

describe("technician work order access", () => {
  it("allows start from draft or scheduled", () => {
    expect(canTechnicianStartWorkOrder(WorkOrderStatus.draft)).toBe(true);
    expect(canTechnicianStartWorkOrder(WorkOrderStatus.scheduled)).toBe(true);
    expect(canTechnicianStartWorkOrder(WorkOrderStatus.in_progress)).toBe(false);
  });

  it("allows complete only from in progress", () => {
    expect(canTechnicianCompleteWorkOrder(WorkOrderStatus.in_progress)).toBe(true);
    expect(canTechnicianCompleteWorkOrder(WorkOrderStatus.scheduled)).toBe(false);
  });

  it("blocks edits on closed work orders", () => {
    expect(isTechnicianWorkOrderEditable(WorkOrderStatus.completed)).toBe(false);
    expect(isTechnicianWorkOrderEditable(WorkOrderStatus.in_progress)).toBe(true);
  });
});
