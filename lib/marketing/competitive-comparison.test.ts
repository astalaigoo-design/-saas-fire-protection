import { describe, expect, it } from "vitest";
import {
  COMPARISON_ROWS,
  COMPARE_FAQS,
  COMPETITIVE_STRENGTHS,
} from "@/lib/marketing/competitive-comparison";

describe("competitive comparison content", () => {
  it("includes AHJ portal row with honest flareflow positioning", () => {
    const ahjRow = COMPARISON_ROWS.find((row) =>
      row.feature.includes("AHJ portal"),
    );
    expect(ahjRow).toBeDefined();
    expect(ahjRow?.flareflow.rating).toBe("no");
    expect(ahjRow?.flareflow.note.toLowerCase()).toContain("pdf");
  });

  it("has substantive strengths and FAQs", () => {
    expect(COMPETITIVE_STRENGTHS.length).toBeGreaterThanOrEqual(3);
    expect(COMPARE_FAQS.length).toBeGreaterThanOrEqual(4);
  });
});
