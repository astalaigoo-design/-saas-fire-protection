import { ReportStatus } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { ComplianceReportDocument } from "@/lib/reports/compliance-report-document";
import type { ComplianceReportData } from "@/lib/reports/queries";
import { getComplianceReportData } from "@/lib/reports/queries";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export async function fetchComplianceReportData(
  session: DashboardSession,
  inspectionId: string,
): Promise<ComplianceReportData | null> {
  return getComplianceReportData(session, inspectionId);
}

/** Renders a compliance PDF buffer from loaded inspection data. */
export async function renderComplianceReportPdf(
  data: ComplianceReportData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<ComplianceReportDocument data={data} />);
  return Buffer.from(buffer);
}

function buildFilename(data: ComplianceReportData): string {
  const slug = data.building.customer.name.replace(/[^\w-]+/g, "-").toLowerCase();
  const date = (data.completedAt ?? new Date()).toISOString().slice(0, 10);
  return `compliance-${slug}-${date}.pdf`;
}

/**
 * Generates a compliance PDF for a completed inspection and records a Report row.
 */
export async function generateComplianceReport(
  session: DashboardSession,
  inspectionId: string,
): Promise<{ buffer: Buffer; reportId: string; filename: string }> {
  const data = await fetchComplianceReportData(session, inspectionId);
  if (!data) {
    throw new Error(
      "Inspection not found, not completed, or you do not have access.",
    );
  }

  const storageUrl = `/api/inspections/${inspectionId}/report`;
  const existing = await prisma.report.findFirst({
    where: { inspectionId },
    orderBy: { createdAt: "desc" },
  });

  const report = existing
    ? await prisma.report.update({
        where: { id: existing.id },
        data: { status: ReportStatus.generating },
      })
    : await prisma.report.create({
        data: {
          inspectionId,
          title: `Compliance — ${data.building.customer.name}`,
          storageUrl,
          status: ReportStatus.generating,
        },
      });

  try {
    const buffer = await renderComplianceReportPdf(data);
    const now = new Date();

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.finalized,
        generatedAt: now,
        title: `Compliance — ${data.building.customer.name} — ${now.toISOString().slice(0, 10)}`,
        storageUrl,
      },
    });

    return { buffer, reportId: report.id, filename: buildFilename(data) };
  } catch (error) {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: ReportStatus.failed },
    });
    throw error;
  }
}
