import { InspectionItemResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { resolveAssetIdForRepairCompletion } from "@/lib/work-orders/asset-service-on-complete";

describe("resolveAssetIdForRepairCompletion", () => {
  const assets = [
    { id: "asset-fe-1", tagNumber: "FE-101" },
    { id: "asset-fe-2", tagNumber: "FE-1" },
  ];

  it("resolves linked tag from deficiency inspection item", () => {
    const assetId = resolveAssetIdForRepairCompletion(
      {
        result: InspectionItemResult.fail,
        linkedTagNumber: "FE-101",
        label: "Extinguisher pressure",
        notes: null,
      },
      assets,
    );
    expect(assetId).toBe("asset-fe-1");
  });

  it("falls back to tag in checklist label", () => {
    const assetId = resolveAssetIdForRepairCompletion(
      {
        result: InspectionItemResult.fail,
        linkedTagNumber: null,
        label: "Gauge on FE-101 out of range",
        notes: null,
      },
      assets,
    );
    expect(assetId).toBe("asset-fe-1");
  });
});
