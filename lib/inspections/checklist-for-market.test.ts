import { OperatingMarket } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getDefaultChecklistForMarket } from "@/lib/inspections/checklist-for-market";

describe("getDefaultChecklistForMarket", () => {
  it("returns NFPA citations for US monthly inspections", () => {
    const items = getDefaultChecklistForMarket("monthly", OperatingMarket.US);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.description).toContain("NFPA");
  });

  it("returns BS / UK citations for UK monthly inspections", () => {
    const items = getDefaultChecklistForMarket("monthly", OperatingMarket.UK);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.description).toContain("BS");
  });

  it("falls back to annual pack for unknown codes", () => {
    const us = getDefaultChecklistForMarket("unknown-pack", OperatingMarket.US);
    const uk = getDefaultChecklistForMarket("unknown-pack", OperatingMarket.UK);
    expect(us.length).toBeGreaterThan(0);
    expect(uk.length).toBeGreaterThan(0);
    expect(us[0]?.description).toContain("NFPA");
    expect(uk[0]?.description).toContain("BS");
  });
});
