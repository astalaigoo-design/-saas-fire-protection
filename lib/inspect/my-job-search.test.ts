import { describe, expect, it } from "vitest";
import { matchesMyJobSearch } from "@/lib/inspect/my-job-search";
import type { JobCatalogEntry } from "@/lib/offline/job-catalog";

const job: JobCatalogEntry = {
  inspectionId: "insp_1",
  label: "Tower A",
  subtitle: "Acme PM · Annual",
  scheduledAt: "2026-06-15T14:00:00.000Z",
  addressLine: "100 Market St, San Francisco, CA 94105",
  mapsQuery: "Tower A, 100 Market St, San Francisco, CA 94105",
};

describe("matchesMyJobSearch", () => {
  it("matches customer name in subtitle", () => {
    expect(matchesMyJobSearch(job, "acme")).toBe(true);
  });

  it("matches street address", () => {
    expect(matchesMyJobSearch(job, "market st")).toBe(true);
  });

  it("returns all when query empty", () => {
    expect(matchesMyJobSearch(job, "  ")).toBe(true);
  });

  it("returns false when no match", () => {
    expect(matchesMyJobSearch(job, "denver")).toBe(false);
  });
});
