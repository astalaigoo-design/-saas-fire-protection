import { describe, expect, it } from "vitest";
import { formatCertificateNumber } from "@/lib/reports/allocate-certificate-number";
import { resolveReportTemplateKey } from "@/lib/reports/select-report-template";

describe("formatCertificateNumber", () => {
  it("formats with prefix and padded sequence", () => {
    expect(
      formatCertificateNumber({ prefix: "AFD-", year: 2026, sequence: 42 }),
    ).toBe("AFD-2026-00042");
  });

  it("formats without prefix", () => {
    expect(formatCertificateNumber({ prefix: null, year: 2026, sequence: 1 })).toBe("2026-00001");
  });
});

describe("resolveReportTemplateKey", () => {
  it("uses jurisdiction override when set", () => {
    expect(
      resolveReportTemplateKey({
        inspectionTypeCode: "monthly",
        jurisdictionReportTemplateKey: "nfpa72-alarm",
      }),
    ).toBe("nfpa72-alarm");
  });

  it("maps sprinkler types to NFPA 25 template", () => {
    expect(
      resolveReportTemplateKey({
        inspectionTypeCode: "wet",
        jurisdictionReportTemplateKey: null,
      }),
    ).toBe("nfpa25-sprinkler");
  });

  it("maps alarm type to NFPA 72 template", () => {
    expect(
      resolveReportTemplateKey({
        inspectionTypeCode: "alarm",
        jurisdictionReportTemplateKey: "default",
      }),
    ).toBe("nfpa72-alarm");
  });

  it("maps hood type to NFPA 96 template", () => {
    expect(
      resolveReportTemplateKey({
        inspectionTypeCode: "hood",
        jurisdictionReportTemplateKey: null,
      }),
    ).toBe("nfpa96-hood");
  });
});
