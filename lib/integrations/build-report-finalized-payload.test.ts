import { describe, expect, it } from "vitest";
import { buildReportFinalizedWebhookPayload } from "@/lib/integrations/build-report-finalized-payload";

describe("buildReportFinalizedWebhookPayload", () => {
  it("includes jurisdiction and permit fields for partner filing adapters", () => {
    const payload = buildReportFinalizedWebhookPayload({
      reportId: "rep_1",
      inspectionId: "insp_1",
      shareToken: "tok_abc",
      certificateNumber: "AFD-2026-00042",
      reportTemplateKey: "nfpa25-sprinkler",
      inspection: {
        completedAt: new Date("2026-06-01T12:00:00.000Z"),
        buildingId: "bld_1",
        building: {
          customerId: "cust_1",
          name: "Main kitchen",
          addressLine1: "100 Main St",
          city: "Austin",
          fireDistrict: "Austin Fire Department",
          permitNumber: "PERMIT-99",
          permitExpiresAt: new Date("2027-01-01T00:00:00.000Z"),
          jurisdiction: {
            id: "jur_1",
            code: "AFD",
            name: "Austin Fire Department",
            reportTemplateKey: "nfpa25-sprinkler",
          },
        },
        inspectionType: { name: "Sprinkler system", code: "sprinkler" },
        items: [{ result: "pass" }, { result: "pass" }],
      },
    });

    expect(payload.jurisdiction).toEqual({
      id: "jur_1",
      code: "AFD",
      name: "Austin Fire Department",
      reportTemplateKey: "nfpa25-sprinkler",
    });
    expect(payload.permitNumber).toBe("PERMIT-99");
    expect(payload.certificateNumber).toBe("AFD-2026-00042");
    expect(payload.publicReportPdfUrl).toContain("/api/public/reports/tok_abc");
    expect(payload.overallPass).toBe(true);
  });
});
