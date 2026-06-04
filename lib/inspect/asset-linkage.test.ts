import { InspectionItemResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildAssetTagIndex,
  collectServicedAssetIds,
  normalizeEquipmentTag,
  resolveAssetIdForChecklistItem,
  textContainsEquipmentTag,
} from "@/lib/inspect/asset-linkage";

describe("asset linkage", () => {
  const tagIndex = buildAssetTagIndex([
    { id: "asset-fe-1", tagNumber: "FE-101" },
    { id: "asset-fe-2", tagNumber: "FE-1" },
  ]);

  it("normalizes tags for lookup", () => {
    expect(normalizeEquipmentTag("  FE-101 ")).toBe("fe-101");
  });

  it("matches explicit linked tag on template row", () => {
    const assetId = resolveAssetIdForChecklistItem(
      {
        result: InspectionItemResult.pass,
        linkedTagNumber: "FE-101",
        label: "Extinguisher visual",
        notes: null,
      },
      tagIndex,
    );
    expect(assetId).toBe("asset-fe-1");
  });

  it("matches tag embedded in checklist label", () => {
    const assetId = resolveAssetIdForChecklistItem(
      {
        result: InspectionItemResult.pass,
        linkedTagNumber: null,
        label: "Extinguisher FE-101 — pressure gauge",
        notes: null,
      },
      tagIndex,
    );
    expect(assetId).toBe("asset-fe-1");
  });

  it("prefers longer tag match", () => {
    const assetId = resolveAssetIdForChecklistItem(
      {
        result: InspectionItemResult.pass,
        linkedTagNumber: null,
        label: "Check FE-101",
        notes: null,
      },
      tagIndex,
    );
    expect(assetId).toBe("asset-fe-1");
  });

  it("collects serviced assets from register pass and checklist pass", () => {
    const ids = collectServicedAssetIds({
      items: [
        {
          result: InspectionItemResult.pass,
          linkedTagNumber: "FE-101",
          label: "Row A",
          notes: null,
        },
        {
          result: InspectionItemResult.fail,
          linkedTagNumber: "FE-1",
          label: "Row B",
          notes: null,
        },
      ],
      assetChecks: [
        { buildingAssetId: "asset-panel", result: InspectionItemResult.pass },
      ],
      tagIndex,
    });
    expect(ids).toContain("asset-fe-1");
    expect(ids).toContain("asset-panel");
    expect(ids).not.toContain("asset-fe-2");
  });

  it("detects tag tokens in notes", () => {
    expect(textContainsEquipmentTag("Serviced unit fe-101 today", "fe-101")).toBe(
      true,
    );
    expect(textContainsEquipmentTag("FE-1010", "fe-101")).toBe(false);
  });
});
