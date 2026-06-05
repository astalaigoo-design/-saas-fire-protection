import { describe, expect, it } from "vitest";
import {
  v1CreateCustomerSchema,
  v1CreateInspectionSchema,
} from "@/lib/integrations/v1-write-schemas";

describe("v1CreateCustomerSchema", () => {
  it("accepts customer with optional building", () => {
    const parsed = v1CreateCustomerSchema.safeParse({
      name: "Harbor View LLC",
      email: "facilities@harbor.example",
      building: {
        addressLine1: "100 Main St",
        city: "Boston",
        region: "MA",
        postalCode: "02108",
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const parsed = v1CreateCustomerSchema.safeParse({
      name: "Test",
      email: "not-an-email",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("v1CreateInspectionSchema", () => {
  it("requires inspection type id or code", () => {
    const parsed = v1CreateInspectionSchema.safeParse({
      buildingId: "bld_1",
      scheduledAt: "2026-07-01T14:00:00.000Z",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts inspectionTypeCode", () => {
    const parsed = v1CreateInspectionSchema.safeParse({
      buildingId: "bld_1",
      inspectionTypeCode: "annual_sprinkler",
      scheduledAt: "2026-07-01T14:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });
});
