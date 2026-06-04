import { AssetType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  computeDueAssets,
  countDueAssetTotals,
  filterDueAssetsByType,
} from "@/lib/operations/due-assets";

const building = {
  id: "b1",
  name: "Tower A",
  addressLine1: "1 Main St",
  city: "Denver",
  customer: { name: "Acme" },
};

function asset(overrides: Partial<{
  id: string;
  assetType: AssetType;
  nextServiceDue: Date | null;
}>) {
  return {
    id: overrides.id ?? "a1",
    assetType: overrides.assetType ?? AssetType.fire_extinguisher,
    tagNumber: "FE-1",
    location: "Lobby",
    nextServiceDue: overrides.nextServiceDue ?? null,
    lastServiceAt: null,
    building,
  };
}

describe("computeDueAssets", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const monthStart = new Date(2026, 5, 1);
  const monthEnd = new Date(2026, 6, 1);

  it("includes overdue assets before the current month", () => {
    const rows = computeDueAssets({
      assets: [asset({ nextServiceDue: new Date("2026-05-01") })],
      now,
      monthStart,
      monthEnd,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("overdue");
  });

  it("includes assets due later in the current month", () => {
    const rows = computeDueAssets({
      assets: [asset({ nextServiceDue: new Date("2026-06-28") })],
      now,
      monthStart,
      monthEnd,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("due_this_month");
  });

  it("skips assets due next month and assets without a due date", () => {
    const rows = computeDueAssets({
      assets: [
        asset({ id: "a1", nextServiceDue: new Date("2026-07-05") }),
        asset({ id: "a2", nextServiceDue: null }),
      ],
      now,
      monthStart,
      monthEnd,
    });
    expect(rows).toHaveLength(0);
  });
});

describe("countDueAssetTotals", () => {
  it("counts extinguishers separately from all equipment", () => {
    const rows = computeDueAssets({
      assets: [
        asset({ id: "fe1", nextServiceDue: new Date("2026-05-01") }),
        asset({
          id: "fe2",
          nextServiceDue: new Date("2026-06-20"),
        }),
        asset({
          id: "panel",
          assetType: AssetType.fire_alarm_panel,
          nextServiceDue: new Date("2026-06-10"),
        }),
      ],
      now: new Date("2026-06-15"),
      monthStart: new Date(2026, 5, 1),
      monthEnd: new Date(2026, 6, 1),
    });

    const totals = countDueAssetTotals(rows);
    expect(totals.equipmentOverdue).toBe(2);
    expect(totals.equipmentDueThisMonth).toBe(1);
    expect(totals.extinguishersDueThisMonth).toBe(2);
    expect(filterDueAssetsByType(rows, AssetType.fire_extinguisher)).toHaveLength(2);
  });
});
