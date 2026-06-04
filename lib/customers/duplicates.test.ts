import { describe, expect, it } from "vitest";
import { normalizeCustomerName } from "@/lib/customers/duplicates";

describe("normalizeCustomerName", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeCustomerName("  Acme   Corp.  ")).toBe("acme corp");
  });
});
