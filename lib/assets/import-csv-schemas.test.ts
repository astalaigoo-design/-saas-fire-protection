import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assetImportRowSchema, parseAssetTypeFromImport } from "@/lib/assets/import-csv-schemas";

describe("asset import schemas", () => {
  it("parses equipment type aliases", () => {
    expect(parseAssetTypeFromImport("Fire Extinguisher")).toBe(AssetType.fire_extinguisher);
    expect(parseAssetTypeFromImport("panel")).toBe(AssetType.fire_alarm_panel);
  });

  it("requires building locator", () => {
    const result = assetImportRowSchema.safeParse({
      branch: "Main",
      customer: "Acme",
      building_name: "",
      address_line1: "",
      city: "",
      postal_code: "",
      asset_type: "fire_extinguisher",
      location: "Hall",
    });
    expect(result.success).toBe(false);
  });
});
