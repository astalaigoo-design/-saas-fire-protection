import type { ReactElement } from "react";
import { DefaultComplianceDocument } from "@/lib/reports/templates/default-compliance";
import { Nfpa25SprinklerFormDocument } from "@/lib/reports/templates/nfpa25-sprinkler-form";
import { Nfpa72AlarmFormDocument } from "@/lib/reports/templates/nfpa72-alarm-form";
import { Nfpa96HoodFormDocument } from "@/lib/reports/templates/nfpa96-hood-form";
import { isReportTemplateKey, type ReportTemplateKey } from "@/lib/reports/templates/types";
import type { ComplianceReportData } from "@/lib/reports/queries";

export function ComplianceReportDocument({
  data,
}: {
  data: ComplianceReportData;
}): ReactElement {
  const key = data.reportTemplateKey ?? "default";
  const templateKey: ReportTemplateKey = isReportTemplateKey(key) ? key : "default";

  switch (templateKey) {
    case "nfpa25-sprinkler":
      return <Nfpa25SprinklerFormDocument data={data} />;
    case "nfpa72-alarm":
      return <Nfpa72AlarmFormDocument data={data} />;
    case "nfpa96-hood":
      return <Nfpa96HoodFormDocument data={data} />;
    default:
      return <DefaultComplianceDocument data={data} />;
  }
}
