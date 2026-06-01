import { describe, expect, it } from "vitest";
import { REINSPECTION_DAYS, REPAIR_VISIT_DAYS } from "@/lib/scheduling/schedule-from-accepted-quote";

describe("quote visit scheduling defaults", () => {
  it("uses 7 days for repair and 14 for re-inspection", () => {
    expect(REPAIR_VISIT_DAYS).toBe(7);
    expect(REINSPECTION_DAYS).toBe(14);
  });
});
