import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "@/lib/cron/authorize";

function request(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/cron/due-reminders", { headers });
}

describe("isCronAuthorized", () => {
  it("accepts Bearer authorization", () => {
    expect(
      isCronAuthorized(request({ authorization: "Bearer test-secret" }), "test-secret"),
    ).toBe(true);
  });

  it("accepts x-cron-secret header", () => {
    expect(isCronAuthorized(request({ "x-cron-secret": "test-secret" }), "test-secret")).toBe(
      true,
    );
  });

  it("rejects missing or wrong secret", () => {
    expect(isCronAuthorized(request({}), "test-secret")).toBe(false);
    expect(isCronAuthorized(request({ authorization: "Bearer wrong" }), "test-secret")).toBe(
      false,
    );
    expect(isCronAuthorized(request({ authorization: "Bearer x" }), undefined)).toBe(false);
    expect(isCronAuthorized(request({ authorization: "Bearer x" }), "   ")).toBe(false);
  });
});
