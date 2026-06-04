import { describe, expect, it } from "vitest";
import { InspectionItemResult } from "@prisma/client";
import { mergeInspectionWithCache } from "@/lib/offline/inspection-snapshot";
import type { InspectionFormData } from "@/lib/inspect/queries";

function baseInspection(
  overrides: Partial<InspectionFormData> = {},
): InspectionFormData {
  return {
    id: "insp_1",
    buildingId: "bld_1",
    status: "in_progress",
    scheduledAt: new Date("2026-06-01T10:00:00Z"),
    completedAt: null,
    signatureData: null,
    signedAt: null,
    notes: null,
    building: {
      name: "Site",
      addressLine1: "1 Main",
      addressLine2: null,
      city: "Town",
      region: "CA",
      postalCode: "90210",
      customer: { name: "Customer" },
    },
    inspectionType: { name: "Annual" },
    items: [],
    photos: [],
    assetChecks: [],
    ...overrides,
  };
}

const assetCheck = {
  id: "chk_1",
  result: InspectionItemResult.pending,
  notes: null,
  servicedAt: null,
  buildingAsset: {
    id: "asset_1",
    assetType: "fire_extinguisher" as const,
    tagNumber: "FE-1",
    barcodeValue: null,
    location: "Lobby",
    manufacturer: null,
    model: null,
  },
};

describe("mergeInspectionWithCache", () => {
  it("merges offline equipment register pass/fail into server rows", () => {
    const server = baseInspection({
      assetChecks: [{ ...assetCheck, result: InspectionItemResult.pending }],
    });
    const cached = baseInspection({
      assetChecks: [
        {
          ...assetCheck,
          result: InspectionItemResult.pass,
          notes: "OK",
        },
      ],
    });

    const merged = mergeInspectionWithCache(server, cached);
    expect(merged.assetChecks).toHaveLength(1);
    expect(merged.assetChecks[0]?.result).toBe(InspectionItemResult.pass);
    expect(merged.assetChecks[0]?.notes).toBe("OK");
  });
});
