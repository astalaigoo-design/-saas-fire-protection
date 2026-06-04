import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assetTypeLabel } from "@/lib/assets/constants";

describe("assetTypeLabel", () => {
  it("returns human labels for register types", () => {
    expect(assetTypeLabel(AssetType.fire_extinguisher)).toBe("Fire extinguisher");
    expect(assetTypeLabel(AssetType.fire_alarm_panel)).toBe("Fire alarm panel");
  });
});
