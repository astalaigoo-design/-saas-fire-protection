import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  classifyAssetServiceDueBadge,
  computeSystemTestStatusByType,
  computeSystemTestStatusForType,
} from "@/lib/assets/system-test-status";

const now = new Date("2026-06-05T12:00:00Z");

describe("system-test-status", () => {
  it("returns not_registered when no assets of type", () => {
    expect(
      computeSystemTestStatusForType(
        [{ assetType: AssetType.fire_extinguisher, nextServiceDue: null, active: true }],
        AssetType.fire_hydrant,
        now,
      ),
    ).toBe("not_registered");
  });

  it("flags overdue when any asset is past due", () => {
    expect(
      computeSystemTestStatusForType(
        [
          {
            assetType: AssetType.standpipe,
            nextServiceDue: new Date("2026-05-01T00:00:00Z"),
            active: true,
          },
        ],
        AssetType.standpipe,
        now,
      ),
    ).toBe("overdue");
  });

  it("aggregates status by water-system type", () => {
    const status = computeSystemTestStatusByType(
      [
        {
          assetType: AssetType.fire_hydrant,
          nextServiceDue: new Date("2026-07-01T00:00:00Z"),
          active: true,
        },
        {
          assetType: AssetType.sprinkler_component,
          nextServiceDue: null,
          active: true,
        },
      ],
      now,
    );
    expect(status.fire_hydrant).toBe("due_soon");
    expect(status.standpipe).toBe("not_registered");
    expect(status.sprinkler_component).toBe("missing_due_date");
  });

  it("classifies single-asset due badges", () => {
    expect(
      classifyAssetServiceDueBadge(new Date("2026-05-01T00:00:00Z"), now),
    ).toBe("overdue");
    expect(
      classifyAssetServiceDueBadge(new Date("2026-07-01T00:00:00Z"), now),
    ).toBe("due_soon");
    expect(
      classifyAssetServiceDueBadge(new Date("2027-01-01T00:00:00Z"), now),
    ).toBeNull();
  });
});
