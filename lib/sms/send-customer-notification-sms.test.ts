import { describe, expect, it } from "vitest";
import { buildCustomerNotificationSmsBody } from "@/lib/sms/send-customer-notification-sms";

describe("buildCustomerNotificationSmsBody", () => {
  it("builds report ready SMS", () => {
    const body = buildCustomerNotificationSmsBody({
      kind: "report_ready",
      companyName: "Acme Fire",
      buildingLabel: "Main Office",
      link: "https://app.example/r/abc",
    });
    expect(body).toContain("Acme Fire");
    expect(body).toContain("Main Office");
    expect(body).toContain("https://app.example/r/abc");
  });

  it("builds quote sent SMS with total", () => {
    const body = buildCustomerNotificationSmsBody({
      kind: "quote_sent",
      companyName: "Acme Fire",
      buildingLabel: "Warehouse",
      link: "https://app.example/q/xyz",
      totalLabel: "$1,250.00",
    });
    expect(body).toContain("$1,250.00");
    expect(body).toContain("https://app.example/q/xyz");
  });

  it("truncates very long bodies", () => {
    const body = buildCustomerNotificationSmsBody({
      kind: "visit_scheduled",
      companyName: "A".repeat(200),
      buildingLabel: "B".repeat(200),
      link: "https://example.com",
      scheduledAt: new Date("2026-06-15T14:00:00Z"),
    });
    expect(body.length).toBeLessThanOrEqual(320);
    expect(body.endsWith("…")).toBe(true);
  });
});
