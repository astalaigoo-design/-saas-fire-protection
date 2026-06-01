import { describe, expect, it } from "vitest";
import { getNfpaChecklistForInspectionTypeCode } from "@/lib/inspections/nfpa-checklists";
import { NFPA_PACK_TEMPLATES } from "@/lib/inspections/inspection-type-templates";

describe("getNfpaChecklistForInspectionTypeCode", () => {
  it("returns distinct checklists for wet, dry, and kitchen packs", () => {
    const wet = getNfpaChecklistForInspectionTypeCode("wet");
    const dry = getNfpaChecklistForInspectionTypeCode("dry");
    const kitchen = getNfpaChecklistForInspectionTypeCode("kitchen");

    expect(wet.length).toBeGreaterThan(0);
    expect(dry.length).toBeGreaterThan(0);
    expect(kitchen.length).toBeGreaterThan(0);
    expect(wet[0]?.label).toContain("Wet");
    expect(dry[0]?.label).toMatch(/Dry|drain/i);
  });

  it("lists all optional NFPA packs as templates", () => {
    const codes = NFPA_PACK_TEMPLATES.map((template) => template.code);
    expect(codes).toEqual(
      expect.arrayContaining(["wet", "dry", "sprinkler", "alarm", "hood", "kitchen"]),
    );
  });
});
