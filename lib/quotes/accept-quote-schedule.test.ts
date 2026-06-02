import { describe, expect, it } from "vitest";
import {
  formatReinspectionScheduleDate,
  REINSPECTION_DAYS,
} from "@/lib/quotes/accept-quote-schedule";
import { dashboardScheduleReinspectionFromQuoteUrl } from "@/lib/quotes/dashboard-quote-urls";

describe("accept quote schedule helpers", () => {
  it("formats schedule dates for email copy", () => {
    const formatted = formatReinspectionScheduleDate(new Date("2026-06-16T14:00:00Z"));
    expect(formatted).toMatch(/Jun/);
    expect(formatted).toMatch(/2026/);
  });

  it("builds one-click schedule URL for dashboard", () => {
    expect(dashboardScheduleReinspectionFromQuoteUrl("quote_abc")).toContain(
      "/dashboard/quotes/quote_abc/schedule-follow-up",
    );
    expect(REINSPECTION_DAYS).toBe(14);
  });
});
