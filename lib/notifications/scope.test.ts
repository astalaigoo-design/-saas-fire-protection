import { describe, expect, it } from "vitest";
import {
  canViewStaffNotifications,
  staffNotificationWhereForUser,
} from "@/lib/notifications/scope";

describe("staff notification scope", () => {
  it("allows all staff roles to use the bell", () => {
    expect(canViewStaffNotifications("owner")).toBe(true);
    expect(canViewStaffNotifications("admin")).toBe(true);
    expect(canViewStaffNotifications("technician")).toBe(true);
    expect(canViewStaffNotifications(null)).toBe(false);
  });

  it("technicians only see targeted notifications", () => {
    const where = staffNotificationWhereForUser({
      companyId: "co_1",
      appUserId: "usr_tech",
      role: "technician",
    });
    expect(where).toEqual({
      companyId: "co_1",
      targetUserId: "usr_tech",
    });
  });

  it("owners see company-wide and assignment alerts", () => {
    const where = staffNotificationWhereForUser({
      companyId: "co_1",
      appUserId: "usr_owner",
      role: "owner",
    });
    expect(where.OR).toHaveLength(2);
  });
});
