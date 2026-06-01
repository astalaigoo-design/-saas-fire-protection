import type { DashboardSession } from "@/lib/dashboard/session";
import { generateComplianceReport } from "@/lib/reports/generate-compliance-report";

export type ComplianceReportAttachment = {
  buffer: Buffer;
  filename: string;
  shareToken: string;
  reportId: string;
};

/** Generate (or refresh) the compliance PDF for an inspection. */
export async function loadComplianceReportAttachment(
  session: DashboardSession,
  inspectionId: string,
): Promise<ComplianceReportAttachment | null> {
  try {
    const generated = await generateComplianceReport(session, inspectionId);
    return {
      buffer: generated.buffer,
      filename: generated.filename,
      shareToken: generated.shareToken,
      reportId: generated.reportId,
    };
  } catch (error) {
    console.error("loadComplianceReportAttachment failed", error);
    return null;
  }
}
