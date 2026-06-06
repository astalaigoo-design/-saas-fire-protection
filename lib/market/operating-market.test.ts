import { OperatingMarket } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getDefaultCountryForMarket,
  getDefaultCurrencyForMarket,
  getMarketConfig,
  parseOperatingMarket,
} from "@/lib/market/operating-market";
import { getBootstrapInspectionTypesForMarket } from "@/lib/market/inspection-type-labels";

describe("operating market config", () => {
  it("defaults US tenants to USD and US country", () => {
    expect(getDefaultCountryForMarket(OperatingMarket.US)).toBe("US");
    expect(getDefaultCurrencyForMarket(OperatingMarket.US)).toBe("USD");
    expect(getMarketConfig(OperatingMarket.US).checklistResetLabel).toContain("NFPA");
  });

  it("defaults UK tenants to GBP and GB country", () => {
    expect(getDefaultCountryForMarket(OperatingMarket.UK)).toBe("GB");
    expect(getDefaultCurrencyForMarket(OperatingMarket.UK)).toBe("GBP");
    expect(getMarketConfig(OperatingMarket.UK).checklistResetLabel).toContain("UK");
  });

  it("parses UK from string input", () => {
    expect(parseOperatingMarket("UK")).toBe(OperatingMarket.UK);
    expect(parseOperatingMarket("US")).toBe(OperatingMarket.US);
  });
});

describe("getBootstrapInspectionTypesForMarket", () => {
  it("localizes cadence names for UK companies", () => {
    const types = getBootstrapInspectionTypesForMarket(OperatingMarket.UK);
    expect(types.map((t) => t.code)).toEqual(["monthly", "quarterly", "annual"]);
    expect(types[0]?.name).toContain("fire safety");
  });
});
