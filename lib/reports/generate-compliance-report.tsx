import { ReportStatus } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { ComplianceReportDocument } from "@/lib/reports/compliance-report-document";
import { allocateCertificateNumber } from "@/lib/reports/allocate-certificate-number";
import { embedPhotosForPdf } from "@/lib/reports/embed-pdf-images";
import { sanitizeSignatureForPdf } from "@/lib/reports/pdf-images";
import type { ComplianceReportData } from "@/lib/reports/queries";
import { getComplianceReportData } from "@/lib/reports/queries";
import { resolveReportTemplateKey } from "@/lib/reports/select-report-template";
import { isReportTemplateKey, type ReportTemplateKey } from "@/lib/reports/templates/types";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";
import { ensureReportShareToken } from "@/lib/reports/share-token";

export async function fetchComplianceReportData(
  session: DashboardSession,
  inspectionId: string,
): Promise<ComplianceReportData | null> {
  return getComplianceReportData(session, inspectionId);
}

async function prepareDataForPdf(data: ComplianceReportData): Promise<ComplianceReportData> {
  const photos = await embedPhotosForPdf(data.photos);
  return {
    ...data,
    photos,
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
  const safeData = await prepareDataForPdf(data);
  const buffer = await renderToBuffer(<ComplianceReportDocument data={safeData} />);
  return Buffer.from(buffer);
}

function buildFilename(data: ComplianceReportData): string {
  const slug = data.building.customer.name.replace(/[^\w-]+/g, "-").toLowerCase();
  const date = (data.completedAt ?? new Date()).toISOString().slice(0, 10);
  const cert = data.certificateNumber
    ? data.certificateNumber.replace(/[^\w-]+/g, "-")
    : null;
  return cert
    ? `certificate-${cert}-${slug}.pdf`
    : `compliance-${slug}-${date}.pdf`;
}

/**
 * Generates a compliance PDF for a completed inspection and records a Report row.
 */
export async function generateComplianceReport(
  session: DashboardSession,
  inspectionId: string,
): Promise<{ buffer: Buffer; reportId: string; filename: string; shareToken: string }> {
  const data = await fetchComplianceReportData(session, inspectionId);
  if (!data) {
    throw new Error(
      "Inspection not found, not completed, or you do not have access.",
    );
  }

  const reportTemplateKey = resolveReportTemplateKey({
    inspectionTypeCode: data.inspectionType.code,
    jurisdictionReportTemplateKey:
      data.building.jurisdiction?.reportTemplateKey ?? null,
  });

  const jurisdictionId = data.building.jurisdiction?.id ?? null;
  const storageUrl = `/api/inspections/${inspectionId}/report`;
  const now = new Date();
  const title = `Compliance — ${data.building.customer.name} — ${now.toISOString().slice(0, 10)}`;

  const existing = await prisma.report.findFirst({
    where: { inspectionId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      certificateNumber: true,
      reportTemplateKey: true,
    },
  });

  let reportId: string;
  let certificateNumber: string;

  if (existing?.certificateNumber) {
    certificateNumber = existing.certificateNumber;
    const updated = await prisma.report.update({
      where: { id: existing.id },
      data: {
        status: ReportStatus.finalized,
        generatedAt: now,
        title,
        storageUrl,
        reportTemplateKey,
      },
      select: { id: true },
    });
    reportId = updated.id;
  } else {
    const created = await prisma.$transaction(async (tx) => {
      const allocated = await allocateCertificateNumber(tx, {
        companyId: session.companyId,
        jurisdictionId,
        issuedAt: now,
      });

      if (existing) {
        return tx.report.update({
          where: { id: existing.id },
          data: {
            status: ReportStatus.finalized,
            generatedAt: now,
            title,
            storageUrl,
            certificateNumber: allocated,
            reportTemplateKey,
          },
          select: { id: true, certificateNumber: true },
        });
      }

      return tx.report.create({
        data: {
          inspectionId,
          companyId: session.companyId,
          title,
          storageUrl,
          status: ReportStatus.finalized,
          generatedAt: now,
          certificateNumber: allocated,
          reportTemplateKey,
        },
        select: { id: true, certificateNumber: true },
      });
    });

    reportId = created.id;
    certificateNumber = created.certificateNumber ?? "";
  }

  const pdfData: ComplianceReportData = {
    ...data,
    certificateNumber,
    reportTemplateKey: isReportTemplateKey(reportTemplateKey)
      ? reportTemplateKey
      : "default",
  };

  const buffer = await renderComplianceReportPdf(pdfData);
  const filename = buildFilename(pdfData);
  const shareToken = await ensureReportShareToken(reportId);

  try {
    const { emitReportFinalizedWebhook } = await import("@/lib/integrations/emit");
    await emitReportFinalizedWebhook({
      companyId: session.companyId,
      reportId,
      inspectionId,
      shareToken,
      certificateNumber,
    });
  } catch (error) {
    console.error("emitReportFinalizedWebhook failed", error);
  }

  return { buffer, reportId, filename, shareToken };
}
