import { renderToBuffer } from "@react-pdf/renderer";
import { ComplianceReportDocument } from "@/lib/reports/templates/registry";
import { buildSampleComplianceReportData } from "@/lib/reports/templates/sample-data";
import { isReportTemplateKey, type ReportTemplateKey } from "@/lib/reports/templates/types";

export async function generateReportTemplatePreview(
  templateKey: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!isReportTemplateKey(templateKey)) return null;

  const data = buildSampleComplianceReportData(templateKey);
  const buffer = await renderToBuffer(<ComplianceReportDocument data={data} />);
  const filename = `flareflow-template-preview-${templateKey}.pdf`;
  return { buffer: Buffer.from(buffer), filename };
}

export function reportTemplatePreviewUrl(templateKey: ReportTemplateKey): string {
  return `/api/reports/template-preview/${templateKey}`;
}
