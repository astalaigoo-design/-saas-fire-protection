import { describe, expect, it } from "vitest";
import {
  formatAutomationRunSummary,
  formatRecentDueReminderLine,
} from "@/lib/operations/automation-visibility";

describe("formatAutomationRunSummary", () => {
  it("describes a run with sends", () => {
    const runAt = new Date("2026-06-02T13:00:00.000Z");
    const summary = formatAutomationRunSummary(runAt, 3);
    expect(summary).toContain("3 sent that run");
  });

  it("describes a zero-send run", () => {
    const runAt = new Date("2026-06-02T13:00:00.000Z");
    const summary = formatAutomationRunSummary(runAt, 0);
    expect(summary).toContain("0 sent that run");
  });

  it("handles missing run", () => {
    expect(formatAutomationRunSummary(null, null)).toBe(
      "No automated check recorded yet.",
    );
  });
});

describe("formatRecentDueReminderLine", () => {
  it("joins building, type, due date, and recipient", () => {
    const line = formatRecentDueReminderLine({
      id: "evt_1",
      createdAt: new Date("2026-05-28T13:00:00.000Z"),
      buildingLabel: "Riverside Tower",
      inspectionTypeName: "Annual",
      dueAt: "2026-06-04T00:00:00.000Z",
      sentTo: "owner@example.com",
    });
    expect(line).toContain("Riverside Tower");
    expect(line).toContain("Annual due");
    expect(line).toContain("owner@example.com");
  });
});
