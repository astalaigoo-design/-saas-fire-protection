import { describe, expect, it } from "vitest";
import { SEO_LANDING_PAGES, SEO_LANDING_PATHS } from "@/lib/seo/landing-pages";

describe("SEO landing pages", () => {
  it("exports unique public paths", () => {
    expect(new Set(SEO_LANDING_PATHS).size).toBe(SEO_LANDING_PATHS.length);
  });

  it("includes required solution pages", () => {
    expect(SEO_LANDING_PATHS).toContain("/nfpa-25-inspection-software");
    expect(SEO_LANDING_PATHS).toContain("/fire-sprinkler-inspection-app");
    expect(SEO_LANDING_PATHS).toContain("/fire-alarm-compliance-reporting-software");
    expect(SEO_LANDING_PATHS).toContain("/fire-protection-repair-quoting-software");
  });

  it("requires substantive content on each page", () => {
    for (const page of SEO_LANDING_PAGES) {
      expect(page.sections.length).toBeGreaterThanOrEqual(3);
      expect(page.faqs?.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(page.relatedLinks.length).toBeGreaterThanOrEqual(3);
    }
  });
});
