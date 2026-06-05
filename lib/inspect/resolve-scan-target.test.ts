import { AssetType, InspectionItemResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { resolveInspectionScanTarget } from "@/lib/inspect/resolve-scan-target";

const assetChecks = [
  {
    id: "check-1",
    asset: {
      id: "asset-1",
      tagNumber: "FE-101",
      barcodeValue: "urn:ext:101",
      assetType: AssetType.fire_extinguisher,
      location: "Lobby",
    },
  },
  {
    id: "check-2",
    asset: {
      id: "asset-2",
      tagNumber: "FE-202",
      barcodeValue: null,
      assetType: AssetType.fire_extinguisher,
      location: "Stair 2",
    },
  },
];

describe("resolveInspectionScanTarget", () => {
  it("opens checklist row linked by template tag", () => {
    const target = resolveInspectionScanTarget({
      scanValue: "FE-101",
      items: [
        {
          id: "item-a",
          label: "Extinguisher visual",
          description: null,
          linkedTagNumber: "FE-101",
          result: InspectionItemResult.pending,
          notes: null,
        },
        {
          id: "item-b",
          label: "Hose cabinet",
          description: null,
          linkedTagNumber: null,
          result: InspectionItemResult.pending,
          notes: null,
        },
      ],
      assetChecks,
    });

    expect(target).toEqual({
      assetId: "asset-1",
      checklistItemId: "item-a",
      assetCheckId: "check-1",
      label: "Fire extinguisher · Tag FE-101",
    });
  });

  it("matches barcode payload and prefers pending checklist row", () => {
    const target = resolveInspectionScanTarget({
      scanValue: "urn:ext:101",
      items: [
        {
          id: "item-done",
          label: "FE-101 — gauge",
          description: null,
          linkedTagNumber: "FE-101",
          result: InspectionItemResult.pass,
          notes: null,
        },
        {
          id: "item-pending",
          label: "FE-101 — bracket",
          description: null,
          linkedTagNumber: "FE-101",
          result: InspectionItemResult.pending,
          notes: null,
        },
      ],
      assetChecks,
    });

    expect(target?.checklistItemId).toBe("item-pending");
    expect(target?.assetCheckId).toBe("check-1");
  });

  it("falls back to register when no checklist link exists", () => {
    const target = resolveInspectionScanTarget({
      scanValue: "FE-202",
      items: [
        {
          id: "item-other",
          label: "Panel power",
          description: null,
          linkedTagNumber: null,
          result: InspectionItemResult.pending,
          notes: null,
        },
      ],
      assetChecks,
    });

    expect(target).toEqual({
      assetId: "asset-2",
      checklistItemId: null,
      assetCheckId: "check-2",
      label: "Fire extinguisher · Tag FE-202",
    });
  });

  it("returns null when scan does not match register or checklist", () => {
    const target = resolveInspectionScanTarget({
      scanValue: "FE-999",
      items: [
        {
          id: "item-a",
          label: "General walkthrough",
          description: null,
          linkedTagNumber: null,
          result: InspectionItemResult.pending,
          notes: null,
        },
      ],
      assetChecks,
    });

    expect(target).toBeNull();
  });
});
