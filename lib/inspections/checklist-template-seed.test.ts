import { describe, expect, it } from "vitest";
import { getNfpaChecklistForInspectionTypeCode } from "@/lib/inspections/nfpa-checklists";

describe("checklist template NFPA source", () => {
  it("monthly and wet packs have distinct item counts", () => {
    const monthly = getNfpaChecklistForInspectionTypeCode("monthly");
    const wet = getNfpaChecklistForInspectionTypeCode("wet");
    expect(monthly.length).toBeGreaterThan(0);
    expect(wet.length).toBeGreaterThan(0);
    expect(monthly[0]?.label).not.toBe(wet[0]?.label);
  });
});
