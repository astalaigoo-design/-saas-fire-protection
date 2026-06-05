/** What compliance PDFs do in Flareflow — not a city-by-city AHJ form library. */
export const COMPLIANCE_PDF_CAPABILITIES = [
  "Standard compliance certificate with checklist results, photos, and signature",
  "NFPA 25 sprinkler, NFPA 72 alarm, and NFPA 96 hood form layouts (Flareflow-native)",
  "Jurisdiction metadata — AHJ name, permit number, certificate numbering per AHJ",
  "Auto-select NFPA layout from inspection type; override per jurisdiction in Organization settings",
] as const;

/** Explicitly out of scope — large content / integration projects. */
export const COMPLIANCE_PDF_NOT_INCLUDED = [
  "City- or county-specific AHJ PDF forms (e.g. individual fire marshal layouts)",
  "Pre-filled municipal inspection forms",
  "Built-in AHJ e-filing — use report.finalized webhooks with a certified partner instead",
  "Scan/OCR of legacy paper forms",
] as const;
