import { InspectionItemResult } from "@prisma/client";
import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { collectServiceRecordedRows } from "@/lib/inspect/job-equipment";

describe("collectServiceRecordedRows", () => {
  it("returns only checks with servicedAt set", () => {
    const rows = collectServiceRecordedRows([
      {
        result: InspectionItemResult.pass,
        servicedAt: new Date("2026-06-05T12:00:00Z"),
        buildingAsset: {
          id: "a1",
          assetType: AssetType.fire_extinguisher,
          tagNumber: "FE-1",
          location: "Lobby",
        },
      },
      {
        result: InspectionItemResult.pending,
        servicedAt: null,
        buildingAsset: {
          id: "a2",
          assetType: AssetType.fire_alarm_panel,
          tagNumber: null,
          location: "Mechanical",
        },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("a1");
    expect(rows[0]?.label).toContain("FE-1");
  });
});
