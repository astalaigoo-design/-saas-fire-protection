import { describe, expect, it } from "vitest";
import { validateWorkOrderPartStock } from "@/lib/work-orders/part-stock-validation";

describe("validateWorkOrderPartStock", () => {
  it("passes when stock is sufficient", () => {
    const parts = new Map([["part_1", { sku: "EXT-01", quantityOnHand: 5 }]]);
    expect(
      validateWorkOrderPartStock([{ partId: "part_1", quantity: 2, label: "Extinguisher" }], parts),
    ).toEqual({ ok: true });
  });

  it("blocks when stock is insufficient", () => {
    const parts = new Map([["part_1", { sku: "EXT-01", quantityOnHand: 1 }]]);
    const result = validateWorkOrderPartStock(
      [{ partId: "part_1", quantity: 3, label: "Extinguisher" }],
      parts,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Insufficient stock for EXT-01/);
    }
  });

  it("ignores ad-hoc lines without catalog partId", () => {
    expect(
      validateWorkOrderPartStock([{ partId: null, quantity: 99, label: "Custom labor" }], new Map()),
    ).toEqual({ ok: true });
  });
});
