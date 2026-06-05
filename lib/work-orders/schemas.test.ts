import { WorkOrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  addWorkOrderPartLineSchema,
  createWorkOrderSchema,
  technicianWorkOrderNotesSchema,
  updateWorkOrderSchema,
} from "@/lib/work-orders/schemas";

const cuid = "cjld2cjxh0000qzrmn831iay";

describe("createWorkOrderSchema", () => {
  it("accepts minimal valid input", () => {
    const result = createWorkOrderSchema.safeParse({
      buildingId: cuid,
      title: "Replace fusible links",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createWorkOrderSchema.safeParse({
      buildingId: cuid,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateWorkOrderSchema", () => {
  it("accepts status transitions payload", () => {
    const result = updateWorkOrderSchema.safeParse({
      workOrderId: cuid,
      title: "Hood service",
      status: WorkOrderStatus.in_progress,
    });
    expect(result.success).toBe(true);
  });
});

describe("addWorkOrderPartLineSchema", () => {
  it("coerces quantity and unit cents", () => {
    const result = addWorkOrderPartLineSchema.safeParse({
      workOrderId: cuid,
      label: "Nozzle cap",
      quantity: "2",
      unitCents: "1500",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
      expect(result.data.unitCents).toBe(1500);
    }
  });

  it("rejects invalid quantity", () => {
    const result = addWorkOrderPartLineSchema.safeParse({
      workOrderId: cuid,
      label: "Nozzle cap",
      quantity: "0",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe("invalid");
  });
});

describe("technicianWorkOrderNotesSchema", () => {
  it("allows empty notes", () => {
    const result = technicianWorkOrderNotesSchema.safeParse({
      workOrderId: cuid,
      notes: "",
    });
    expect(result.success).toBe(true);
  });
});
