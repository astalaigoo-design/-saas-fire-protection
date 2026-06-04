import { describe, expect, it } from "vitest";
import {
  dueReminderBuildingWhere,
  dueReminderInspectionTypeWhere,
  dueReminderInspectionWhere,
} from "@/lib/scheduling/due-reminder-scope";

describe("due-reminder cron scope", () => {
  it("filters by company only, not branch", () => {
    const companyId = "co_test";
    expect(dueReminderBuildingWhere(companyId)).toEqual({ customer: { companyId } });
    expect(dueReminderInspectionWhere(companyId)).toEqual({ companyId });
    expect(dueReminderInspectionTypeWhere(companyId)).toEqual({ companyId });

    const serialized = JSON.stringify({
      building: dueReminderBuildingWhere(companyId),
      inspection: dueReminderInspectionWhere(companyId),
    });
    expect(serialized).not.toContain("branchId");
  });
});
