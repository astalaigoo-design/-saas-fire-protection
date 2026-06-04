import { describe, expect, it } from "vitest";
import {
  assetLabelScanPayload,
  buildAssetScanIndex,
  findAssetIdByScanValue,
  normalizeScanValue,
} from "@/lib/assets/scan-match";

describe("scan-match", () => {
  const assets = [
    { id: "a1", tagNumber: "FE-101", barcodeValue: null },
    { id: "a2", tagNumber: "FE-2", barcodeValue: "urn:fe:200" },
  ];

  it("normalizes scan values", () => {
    expect(normalizeScanValue("  FE-101 ")).toBe("fe-101");
  });

  it("indexes tag and barcode separately", () => {
    const index = buildAssetScanIndex(assets);
    expect(findAssetIdByScanValue("fe-101", index)).toBe("a1");
    expect(findAssetIdByScanValue("urn:fe:200", index)).toBe("a2");
    expect(findAssetIdByScanValue("FE-2", index)).toBe("a2");
  });

  it("prefers barcode for label payload when set", () => {
    expect(assetLabelScanPayload(assets[1]!)).toBe("urn:fe:200");
    expect(assetLabelScanPayload(assets[0]!)).toBe("FE-101");
  });
});
