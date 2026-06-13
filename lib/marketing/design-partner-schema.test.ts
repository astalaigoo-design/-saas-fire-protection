import { describe, expect, it } from "vitest";
import { designPartnerApplicationSchema } from "@/lib/marketing/design-partner-schema";

describe("designPartnerApplicationSchema", () => {
  it("accepts required fields and trims optional blanks", () => {
    const result = designPartnerApplicationSchema.safeParse({
      companyName: "  Acme Fire  ",
      contactName: "Jane Doe",
      email: "jane@acme.com",
      phone: "",
      teamSize: "",
      message: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe("Acme Fire");
      expect(result.data.phone).toBeUndefined();
      expect(result.data.teamSize).toBeUndefined();
      expect(result.data.message).toBeUndefined();
    }
  });

  it("rejects missing company name", () => {
    const result = designPartnerApplicationSchema.safeParse({
      companyName: "",
      contactName: "Jane Doe",
      email: "jane@acme.com",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = designPartnerApplicationSchema.safeParse({
      companyName: "Acme Fire",
      contactName: "Jane Doe",
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });
});
