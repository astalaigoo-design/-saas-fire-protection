import { ReportStatus } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { ComplianceReportDocument } from "@/lib/reports/compliance-report-document";
import {
  filterPhotosForPdf,
  sanitizeSignatureForPdf,
} from "@/lib/reports/pdf-images";
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

function prepareDataForPdf(data: ComplianceReportData): ComplianceReportData {
  return {
    ...data,
    photos: filterPhotosForPdf(data.photos),
    signatureData: sanitizeSignatureForPdf(data.signatureData),
    company: {
      ...data.company,
      logoUrl:
        data.company.logoUrl && data.company.logoUrl.length < 500_000
          ? data.company.logoUrl
          : null,
    },
  };
}

/** Renders a compliance PDF buffer from loaded inspection data. */
export async function renderComplianceReportPdf(
  data: ComplianceReportData,
): Promise<Buffer> {
  const safeData = prepareDataForPdf(data);
  const buffer = await renderToBuffer(<ComplianceReportDocument data={safeData} />);
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

  const buffer = await renderComplianceReportPdf(data);
  const filename = buildFilename(data);
  const storageUrl = `/api/inspections/${inspectionId}/report`;
  const now = new Date();

  const existing = await prisma.report.findFirst({
    where: { inspectionId },
    orderBy: { createdAt: "desc" },
  });

  const report = existing
    ? await prisma.report.update({
        where: { id: existing.id },
        data: {
          status: ReportStatus.finalized,
          generatedAt: now,
          title: `Compliance — ${data.building.customer.name} — ${now.toISOString().slice(0, 10)}`,
          storageUrl,
        },
      })
    : await prisma.report.create({
        data: {
          inspectionId,
          title: `Compliance — ${data.building.customer.name} — ${now.toISOString().slice(0, 10)}`,
          storageUrl,
          status: ReportStatus.finalized,
          generatedAt: now,
        },
      });

  return { buffer, reportId: report.id, filename };
}
