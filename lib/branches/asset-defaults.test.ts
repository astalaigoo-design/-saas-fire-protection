import { describe, expect, it } from "vitest";
import { addMonths, computeDefaultNextServiceDue } from "@/lib/branches/asset-defaults";

describe("branch asset defaults", () => {
  it("adds months for next service due", () => {
    const base = new Date(2026, 0, 15);
    const due = computeDefaultNextServiceDue({
      lastServiceAt: base,
      intervalMonths: 12,
    });
    expect(due?.getFullYear()).toBe(2027);
    expect(due?.getMonth()).toBe(0);
  });

  it("returns null without interval", () => {
    expect(
      computeDefaultNextServiceDue({ lastServiceAt: new Date(), intervalMonths: null }),
    ).toBeNull();
  });

  it("addMonths advances calendar month", () => {
    const result = addMonths(new Date(2026, 10, 1), 3);
    expect(result.getMonth()).toBe(1);
    expect(result.getFullYear()).toBe(2027);
  });
});
