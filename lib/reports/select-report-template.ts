import { isReportTemplateKey, type ReportTemplateKey } from "@/lib/reports/templates/types";

const SPRINKLER_TYPE_CODES = new Set(["wet", "dry", "sprinkler"]);
const ALARM_TYPE_CODES = new Set(["alarm"]);

export type ReportTemplateInput = {
  inspectionTypeCode: string;
  jurisdictionReportTemplateKey: string | null;
};

export function resolveReportTemplateKey(input: ReportTemplateInput): ReportTemplateKey {
  if (
    input.jurisdictionReportTemplateKey &&
    input.jurisdictionReportTemplateKey !== "default" &&
    isReportTemplateKey(input.jurisdictionReportTemplateKey)
  ) {
    return input.jurisdictionReportTemplateKey;
  }

  if (SPRINKLER_TYPE_CODES.has(input.inspectionTypeCode)) {
    return "nfpa25-sprinkler";
  }

  if (ALARM_TYPE_CODES.has(input.inspectionTypeCode)) {
    return "nfpa72-alarm";
  }

  return "default";
}
