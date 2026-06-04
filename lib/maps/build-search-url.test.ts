import { describe, expect, it } from "vitest";
import { buildMapsSearchUrl } from "@/lib/maps/build-search-url";

describe("buildMapsSearchUrl", () => {
  it("encodes the address query", () => {
    const url = buildMapsSearchUrl("100 Market St, San Francisco, CA 94105");
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain(encodeURIComponent("100 Market St, San Francisco, CA 94105"));
  });

  it("returns generic maps when query is empty", () => {
    expect(buildMapsSearchUrl("  ")).toBe("https://www.google.com/maps");
  });
});
