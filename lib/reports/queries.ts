import { InspectionStatus, ReportStatus, type Prisma } from "@prisma/client";
import { canViewAllJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { calculateNextInspectionDue } from "@/lib/reports/next-inspection-due";
import { resolveReportTemplateKey } from "@/lib/reports/select-report-template";
import type { ReportTemplateKey } from "@/lib/reports/templates/types";
import { prisma } from "@/lib/prisma";

const complianceReportSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  completedAt: true,
  signedAt: true,
  signatureData: true,
  recurrenceInterval: true,
  notes: true,
  company: {
    select: {
      name: true,
      logoUrl: true,
      reportEmail: true,
      reportPhone: true,
      reportAddress: true,
    },
  },
  building: {
    select: {
      name: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postalCode: true,
      fireDistrict: true,
      permitNumber: true,
      permitExpiresAt: true,
      jurisdiction: {
        select: {
          id: true,
          name: true,
          code: true,
          reportTemplateKey: true,
        },
      },
      customer: { select: { name: true, email: true, phone: true } },
    },
  },
  inspectionType: { select: { name: true, code: true } },
  assignedTo: { select: { name: true, email: true } },
  items: {
    select: {
      label: true,
      description: true,
      sortOrder: true,
      result: true,
      notes: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
  photos: {
    select: { url: true, caption: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.InspectionSelect;

type RawComplianceData = Prisma.InspectionGetPayload<{
  select: typeof complianceReportSelect;
}>;

export type ComplianceReportData = RawComplianceData & {
  inspectorName: string;
  nextInspectionDue: Date;
  certificateNumber: string | null;
  reportTemplateKey: ReportTemplateKey;
  jurisdiction: { name: string; code: string } | null;
  summary: {
    pass: number;
    fail: number;
    na: number;
    pending: number;
    overallPass: boolean;
  };
};

function resolveInspectorName(
  assignedTo: RawComplianceData["assignedTo"],
): string {
  return assignedTo?.name ?? assignedTo?.email ?? "Inspector";
}

function buildSummary(items: RawComplianceData["items"]) {
  const summary = { pass: 0, fail: 0, na: 0, pending: 0, overallPass: true };
  for (const item of items) {
    switch (item.result) {
      case "pass":
        summary.pass += 1;
        break;
      case "fail":
        summary.fail += 1;
        summary.overallPass = false;
        break;
      case "na":
        summary.na += 1;
        break;
      default:
        summary.pending += 1;
        summary.overallPass = false;
    }
  }
  if (summary.pending > 0) summary.overallPass = false;
  return summary;
}

export async function getComplianceReportData(
  session: DashboardSession,
  inspectionId: string,
): Promise<ComplianceReportData | null> {
  const scope = branchScopeFromSession(session);
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      ...inspectionWhereFromScope(scope, session.companyId, {
        status: InspectionStatus.completed,
      }),
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    select: complianceReportSelect,
  });

  if (!inspection || !inspection.completedAt) return null;

  const report = await prisma.report.findFirst({
    where: { inspectionId, status: ReportStatus.finalized },
    orderBy: { generatedAt: "desc" },
    select: {
      certificateNumber: true,
      reportTemplateKey: true,
    },
  });

  const reportMeta: ReportPdfMeta | null = report
    ? {
        certificateNumber: report.certificateNumber,
        reportTemplateKey:
          report.reportTemplateKey &&
          (["default", "nfpa25-sprinkler", "nfpa72-alarm"] as const).includes(
            report.reportTemplateKey as ReportTemplateKey,
          )
            ? (report.reportTemplateKey as ReportTemplateKey)
            : null,
      }
    : null;

  return enrichComplianceReportData(inspection, reportMeta, null);
}

type ReportPdfMeta = {
  certificateNumber: string | null;
  reportTemplateKey: ReportTemplateKey | null;
};

function enrichComplianceReportData(
  inspection: RawComplianceData,
  reportMeta: ReportPdfMeta | null,
  templateOverride: ReportTemplateKey | null,
): ComplianceReportData | null {
  if (!inspection.completedAt) return null;

  const nextInspectionDue = calculateNextInspectionDue(
    inspection.completedAt,
    inspection.recurrenceInterval,
    inspection.inspectionType.code,
  );

  const jurisdiction = inspection.building.jurisdiction;
  const reportTemplateKey =
    templateOverride ??
    reportMeta?.reportTemplateKey ??
    resolveReportTemplateKey({
      inspectionTypeCode: inspection.inspectionType.code,
      jurisdictionReportTemplateKey: jurisdiction?.reportTemplateKey ?? null,
    });

  return {
    ...inspection,
    inspectorName: resolveInspectorName(inspection.assignedTo),
    nextInspectionDue,
    certificateNumber: reportMeta?.certificateNumber ?? null,
    reportTemplateKey,
    jurisdiction: jurisdiction
      ? { name: jurisdiction.name, code: jurisdiction.code }
      : null,
    summary: buildSummary(inspection.items),
  };
}

function toComplianceReportData(
  inspection: RawComplianceData,
  reportMeta?: ReportPdfMeta | null,
): ComplianceReportData | null {
  return enrichComplianceReportData(inspection, reportMeta ?? null, null);
}

/** Loads report data for a completed inspection without session (public share links). */
export async function getComplianceReportDataForInspection(
  inspectionId: string,
): Promise<ComplianceReportData | null> {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      status: InspectionStatus.completed,
    },
    select: complianceReportSelect,
  });
  if (!inspection) return null;

  const report = await prisma.report.findFirst({
    where: { inspectionId, status: ReportStatus.finalized },
    orderBy: { generatedAt: "desc" },
    select: {
      certificateNumber: true,
      reportTemplateKey: true,
    },
  });

  const reportMeta: ReportPdfMeta | null = report
    ? {
        certificateNumber: report.certificateNumber,
        reportTemplateKey:
          report.reportTemplateKey &&
          (["default", "nfpa25-sprinkler", "nfpa72-alarm"] as const).includes(
            report.reportTemplateKey as ReportTemplateKey,
          )
            ? (report.reportTemplateKey as ReportTemplateKey)
            : null,
      }
    : null;

  return toComplianceReportData(inspection, reportMeta);
}
