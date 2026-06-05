import { describe, expect, it } from "vitest";
import { parseCustomerNotificationForm } from "@/lib/notifications/customer-settings";

describe("parseCustomerNotificationForm", () => {
  it("parses checked boxes as true", () => {
    const formData = new FormData();
    formData.set("reportReadyEmail", "on");
    formData.set("visitScheduledSms", "on");

    const parsed = parseCustomerNotificationForm(formData);
    expect(parsed.reportReadyEmail).toBe(true);
    expect(parsed.reportReadySms).toBe(false);
    expect(parsed.visitScheduledSms).toBe(true);
  });
});
