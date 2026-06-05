import { InspectionItemResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  inspectionHasFailedItems,
  validateAssetChecksForSubmit,
  validateChecklistItemsForSubmit,
} from "@/lib/inspect/submit-validation";

describe("validateChecklistItemsForSubmit", () => {
  it("blocks pending items", () => {
    const result = validateChecklistItemsForSubmit([
      { result: InspectionItemResult.pass, notes: null },
      { result: InspectionItemResult.pending, notes: null },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/2 remaining|1 remaining/);
  });

  it("requires notes on failed items", () => {
    const result = validateChecklistItemsForSubmit([
      { result: InspectionItemResult.fail, notes: "  " },
    ]);
    expect(result).toEqual({ ok: false, error: "Every failed item needs a note." });
  });

  it("allows pass, fail with note, and na", () => {
    expect(
      validateChecklistItemsForSubmit([
        { result: InspectionItemResult.pass, notes: null },
        { result: InspectionItemResult.fail, notes: "Blocked head" },
        { result: InspectionItemResult.na, notes: null },
      ]),
    ).toEqual({ ok: true });
  });
});

describe("validateAssetChecksForSubmit", () => {
  it("requires notes on failed equipment", () => {
    expect(
      validateAssetChecksForSubmit([{ result: InspectionItemResult.fail, notes: null }]),
    ).toEqual({ ok: false, error: "Every failed equipment item needs a note." });
  });
});

describe("inspectionHasFailedItems", () => {
  it("detects any fail result", () => {
    expect(inspectionHasFailedItems([{ result: InspectionItemResult.pass, notes: null }])).toBe(
      false,
    );
    expect(inspectionHasFailedItems([{ result: InspectionItemResult.fail, notes: "x" }])).toBe(
      true,
    );
  });
});
