import { OperatingMarket } from "@prisma/client";

/** What compliance PDFs do in Flareflow — not a city-by-city AHJ form library. */
export const COMPLIANCE_PDF_CAPABILITIES_US = [
  "Standard compliance certificate with checklist results, photos, and signature",
  "NFPA 25 sprinkler, NFPA 72 alarm, and NFPA 96 hood form layouts (Flareflow-native)",
  "Jurisdiction metadata — AHJ name, permit number, certificate numbering per AHJ",
  "Auto-select NFPA layout from inspection type; override per jurisdiction in Organization settings",
] as const;

export const COMPLIANCE_PDF_CAPABILITIES_UK = [
  "Standard compliance certificate with checklist results, photos, and signature",
  "Sprinkler, fire alarm, and kitchen suppression form layouts aligned to UK practice (Flareflow-native)",
  "Jurisdiction metadata — enforcing authority, permit number, certificate numbering per jurisdiction",
  "Auto-select layout from inspection type; override per jurisdiction in Organization settings",
] as const;

/** @deprecated Use getCompliancePdfCapabilities(market) */
export const COMPLIANCE_PDF_CAPABILITIES = COMPLIANCE_PDF_CAPABILITIES_US;

/** Explicitly out of scope — large content / integration projects. */
export const COMPLIANCE_PDF_NOT_INCLUDED = [
  "City- or county-specific AHJ PDF forms (e.g. individual fire marshal layouts)",
  "Pre-filled municipal inspection forms",
  "Built-in AHJ e-filing — use report.finalized webhooks with a certified partner instead",
  "Scan/OCR of legacy paper forms",
] as const;

export function getCompliancePdfCapabilities(
  market: OperatingMarket,
): readonly string[] {
  if (market === OperatingMarket.UK) {
    return COMPLIANCE_PDF_CAPABILITIES_UK;
  }
  return COMPLIANCE_PDF_CAPABILITIES_US;
}

export function getCompliancePdfInlineNotice(market: OperatingMarket): {
  title: string;
  body: string;
} {
  if (market === OperatingMarket.UK) {
    return {
      title: "Flareflow-native UK layouts.",
      body: "Certificate PDFs include enforcing authority and permit metadata from building profiles. Not local authority-specific forms — e-filing is partner-specific via Integrations webhooks.",
    };
  }
  return {
    title: "Flareflow-native NFPA layouts.",
    body: "Certificate PDFs include AHJ and permit metadata from building profiles. Not city-specific fire marshal forms — AHJ e-filing is partner-specific via Integrations webhooks.",
  };
}

export function getCompliancePdfScopeDescription(market: OperatingMarket): string {
  if (market === OperatingMarket.UK) {
    return "Inspection data renders into Flareflow certificate layouts. Jurisdiction records drive certificate numbering and optional form overrides — not a full library of local authority forms.";
  }
  return "Inspection data renders into Flareflow certificate layouts. Jurisdiction records drive certificate numbering and optional NFPA form overrides — not a full library of municipal AHJ forms.";
}
