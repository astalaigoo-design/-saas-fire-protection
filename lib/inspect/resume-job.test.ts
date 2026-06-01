import { describe, expect, it } from "vitest";
import { pickPromotedResumeJobId, sortTechnicianJobs } from "@/lib/inspect/resume-job";

describe("sortTechnicianJobs", () => {
  it("lists in_progress before scheduled, then by scheduled time", () => {
    const sorted = sortTechnicianJobs([
      {
        inspectionId: "a",
        status: "scheduled",
        scheduledAt: "2026-06-10T12:00:00.000Z",
      },
      {
        inspectionId: "b",
        status: "in_progress",
        scheduledAt: "2026-06-11T12:00:00.000Z",
      },
      {
        inspectionId: "c",
        status: "scheduled",
        scheduledAt: "2026-06-09T12:00:00.000Z",
      },
    ]);
    expect(sorted.map((j) => j.inspectionId)).toEqual(["b", "c", "a"]);
  });
});

describe("pickPromotedResumeJobId", () => {
  const jobs = [
    {
      inspectionId: "active",
      status: "in_progress",
      scheduledAt: "2026-06-01T12:00:00.000Z",
    },
    {
      inspectionId: "other",
      status: "in_progress",
      scheduledAt: "2026-06-02T12:00:00.000Z",
    },
  ];

  it("prefers active id when it matches an in-progress job", () => {
    expect(pickPromotedResumeJobId(jobs, "other")).toBe("other");
  });

  it("returns first in-progress when no active id", () => {
    expect(pickPromotedResumeJobId(jobs, null)).toBe("active");
  });
});
