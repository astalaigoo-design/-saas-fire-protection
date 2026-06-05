import { InspectionStatus, ReportStatus } from "@prisma/client";
import {
  resolvePublicCompanyBranding,
  type PublicCompanyBranding,
} from "@/lib/companies/public-branding";
import type { ComplianceReportData } from "@/lib/reports/queries";
import { getComplianceReportDataForInspection } from "@/lib/reports/queries";
import { prisma } from "@/lib/prisma";

export type PublicReportMeta = {
  shareToken: string;
  reportId: string;
  inspectionId: string;
  title: string;
  certificateNumber: string | null;
  buildingLabel: string;
  customerName: string;
  companyName: string;
  branding: PublicCompanyBranding;
  inspectionTypeName: string;
  completedAt: Date;
  overallPass: boolean;
};

export async function getPublicReportMeta(
  shareToken: string,
): Promise<PublicReportMeta | null> {
  const report = await prisma.report.findFirst({
    where: {
      shareToken,
      status: ReportStatus.finalized,
      inspection: { status: InspectionStatus.completed },
    },
    select: {
      id: true,
      title: true,
      certificateNumber: true,
      inspection: {
        select: {
          id: true,
          completedAt: true,
          inspectionType: { select: { name: true } },
          company: {
            select: { name: true, logoUrl: true, reportPhone: true, reportEmail: true },
          },
          building: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              customer: { select: { name: true } },
            },
          },
          items: { select: { result: true } },
        },
      },
    },
  });

  if (!report?.inspection.completedAt) return null;

  const building = report.inspection.building;
  const buildingLabel =
    building.name?.trim() || `${building.addressLine1}, ${building.city}`;

  const overallPass = !report.inspection.items.some(
    (item) => item.result === "fail" || item.result === "pending",
  );

  return {
    shareToken,
    reportId: report.id,
    inspectionId: report.inspection.id,
    title:
      report.title ??
      `${report.inspection.inspectionType.name} — ${building.customer.name}`,
    certificateNumber: report.certificateNumber,
    buildingLabel,
    customerName: building.customer.name,
    companyName: report.inspection.company.name,
    branding: resolvePublicCompanyBranding(report.inspection.company),
    inspectionTypeName: report.inspection.inspectionType.name,
    completedAt: report.inspection.completedAt,
    overallPass,
  };
}

export async function getPublicReportPdfData(
  shareToken: string,
): Promise<ComplianceReportData | null> {
  const report = await prisma.report.findFirst({
    where: {
      shareToken,
      status: ReportStatus.finalized,
      inspection: { status: InspectionStatus.completed },
    },
    select: { inspectionId: true },
  });
  if (!report) return null;
  return getComplianceReportDataForInspection(report.inspectionId);
}
