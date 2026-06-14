import { describe, expect, it } from "vitest";
import { isPublicMarketingPath } from "@/lib/marketing/is-public-marketing-path";

describe("isPublicMarketingPath", () => {
  it("matches homepage, pricing, compare, and auth", () => {
    expect(isPublicMarketingPath("/")).toBe(true);
    expect(isPublicMarketingPath("/pricing")).toBe(true);
    expect(isPublicMarketingPath("/compare")).toBe(true);
    expect(isPublicMarketingPath("/sign-in")).toBe(true);
    expect(isPublicMarketingPath("/sign-up")).toBe(true);
  });

  it("excludes dashboard and inspect", () => {
    expect(isPublicMarketingPath("/dashboard")).toBe(false);
    expect(isPublicMarketingPath("/inspect/abc")).toBe(false);
  });
});
