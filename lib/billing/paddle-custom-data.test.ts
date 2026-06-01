import { describe, expect, it } from "vitest";
import { readCompanyIdFromPaddleCustomData } from "@/lib/billing/paddle-custom-data";

describe("readCompanyIdFromPaddleCustomData", () => {
  it("reads trimmed string company_id", () => {
    expect(readCompanyIdFromPaddleCustomData({ company_id: "  cmp_abc  " })).toBe("cmp_abc");
  });

  it("coerces numeric company_id to string", () => {
    expect(readCompanyIdFromPaddleCustomData({ company_id: 42 })).toBe("42");
  });

  it("returns null for missing, empty, or invalid values", () => {
    expect(readCompanyIdFromPaddleCustomData(undefined)).toBeNull();
    expect(readCompanyIdFromPaddleCustomData(null)).toBeNull();
    expect(readCompanyIdFromPaddleCustomData({})).toBeNull();
    expect(readCompanyIdFromPaddleCustomData({ company_id: "" })).toBeNull();
    expect(readCompanyIdFromPaddleCustomData({ company_id: "   " })).toBeNull();
    expect(readCompanyIdFromPaddleCustomData({ company_id: true })).toBeNull();
  });
});
