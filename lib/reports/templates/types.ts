export const REPORT_TEMPLATE_KEYS = [
  "default",
  "nfpa25-sprinkler",
  "nfpa72-alarm",
] as const;

export type ReportTemplateKey = (typeof REPORT_TEMPLATE_KEYS)[number];

export const REPORT_TEMPLATE_LABELS: Record<ReportTemplateKey, string> = {
  default: "Standard compliance certificate",
  "nfpa25-sprinkler": "NFPA 25 sprinkler inspection & testing report",
  "nfpa72-alarm": "NFPA 72 fire alarm inspection report",
};

export function isReportTemplateKey(value: string): value is ReportTemplateKey {
  return (REPORT_TEMPLATE_KEYS as readonly string[]).includes(value);
}
