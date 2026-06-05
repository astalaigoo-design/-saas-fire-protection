import { AssetType, InspectionItemResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { nextServiceDueFromInterval } from "@/lib/assets/service-intervals";
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

  it("advances next due by water-system interval when a register asset passes", () => {
    const completedAt = new Date("2026-06-05T14:00:00Z");
    const servicedIds = collectServicedAssetIds({
      items: [],
      assetChecks: [
        { buildingAssetId: "hydrant-1", result: InspectionItemResult.pass },
      ],
      tagIndex: new Map(),
    });
    expect(servicedIds).toEqual(["hydrant-1"]);

    const nextDue = nextServiceDueFromInterval(completedAt, 12);
    expect(nextDue?.getFullYear()).toBe(2027);
    expect(nextDue?.getMonth()).toBe(5);

    const quarterly = nextServiceDueFromInterval(
      completedAt,
      3,
    );
    expect(quarterly?.getMonth()).toBe(8);
    expect(AssetType.sprinkler_component).toBe("sprinkler_component");
  });
});
