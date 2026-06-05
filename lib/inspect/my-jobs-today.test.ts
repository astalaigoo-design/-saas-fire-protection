import { describe, expect, it } from "vitest";
import { partitionTechnicianJobsByToday } from "@/lib/inspect/my-jobs-today";
import type { JobCatalogEntry } from "@/lib/offline/job-catalog";

function job(id: string, scheduledAt: string): JobCatalogEntry {
  return {
    inspectionId: id,
    label: "Site",
    subtitle: "Customer · Type",
    scheduledAt,
    status: "scheduled",
    addressLine: "123 Main St",
    mapsQuery: "123 Main St",
  };
}

describe("partitionTechnicianJobsByToday", () => {
  it("groups jobs on the reference day in Eastern time", () => {
    const reference = new Date("2026-06-05T16:00:00.000Z");
    const { todayJobs, upcomingJobs } = partitionTechnicianJobsByToday(
      [
        job("a", "2026-06-05T14:00:00.000Z"),
        job("b", "2026-06-06T14:00:00.000Z"),
      ],
      reference,
      "America/New_York",
    );
    expect(todayJobs.map((row) => row.inspectionId)).toEqual(["a"]);
    expect(upcomingJobs.map((row) => row.inspectionId)).toEqual(["b"]);
  });
});
