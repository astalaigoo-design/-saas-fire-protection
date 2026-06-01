import { describe, expect, it } from "vitest";
import { phoneTelHref, resolvePublicCompanyBranding } from "@/lib/companies/public-branding";

describe("resolvePublicCompanyBranding", () => {
  it("sanitizes logo and trims contact fields", () => {
    const branding = resolvePublicCompanyBranding({
      name: "Acme Fire",
      logoUrl: "https://cdn.example.com/logo.png",
      reportPhone: "  +1 (555) 010-2000  ",
      reportEmail: " ops@acme.test ",
    });
    expect(branding.companyName).toBe("Acme Fire");
    expect(branding.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(branding.reportPhone).toBe("+1 (555) 010-2000");
    expect(branding.reportEmail).toBe("ops@acme.test");
  });
});

describe("phoneTelHref", () => {
  it("normalizes phone for tel links", () => {
    expect(phoneTelHref("+1 (555) 010-2000")).toBe("tel:+15550102000");
  });
});
