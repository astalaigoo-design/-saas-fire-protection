import { InspectionStatus, type Prisma } from "@prisma/client";
import { canViewAllJobs } from "@/lib/auth/permissions";
import type { DashboardSession } from "@/lib/dashboard/session";
import { calculateNextInspectionDue } from "@/lib/reports/next-inspection-due";
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
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      companyId: session.companyId,
      status: InspectionStatus.completed,
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    select: complianceReportSelect,
  });

  if (!inspection || !inspection.completedAt) return null;

  const nextInspectionDue = calculateNextInspectionDue(
    inspection.completedAt,
    inspection.recurrenceInterval,
    inspection.inspectionType.code,
  );

  return {
    ...inspection,
    inspectorName: resolveInspectorName(inspection.assignedTo),
    nextInspectionDue,
    summary: buildSummary(inspection.items),
  };
}

function toComplianceReportData(inspection: RawComplianceData): ComplianceReportData | null {
  if (!inspection.completedAt) return null;

  const nextInspectionDue = calculateNextInspectionDue(
    inspection.completedAt,
    inspection.recurrenceInterval,
    inspection.inspectionType.code,
  );

  return {
    ...inspection,
    inspectorName: resolveInspectorName(inspection.assignedTo),
    nextInspectionDue,
    summary: buildSummary(inspection.items),
  };
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
  return toComplianceReportData(inspection);
}
