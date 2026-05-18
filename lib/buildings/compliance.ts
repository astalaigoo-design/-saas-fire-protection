import {
  ComplianceStatus,
  InspectionItemResult,
  InspectionStatus,
  type Prisma,
} from "@prisma/client";

export type { ComplianceStatus };

export type InspectionForCompliance = {
  status: InspectionStatus | string;
  scheduledAt: Date;
  completedAt?: Date | null;
  items: { result: InspectionItemResult }[];
};

export const inspectionForComplianceSelect = {
  status: true,
  scheduledAt: true,
  completedAt: true,
  items: { select: { result: true } },
} satisfies Prisma.InspectionSelect;

/** Derive building compliance from all inspections (source of truth for currentStatus). */
export function deriveBuildingComplianceStatus(
  inspections: InspectionForCompliance[],
  now = new Date(),
): ComplianceStatus {
  const hasOverdue = inspections.some(
    (i) =>
      (i.status === InspectionStatus.scheduled ||
        i.status === InspectionStatus.in_progress) &&
      i.scheduledAt < now,
  );
  if (hasOverdue) return ComplianceStatus.OVERDUE;

  const completed = inspections
    .filter((i) => i.status === InspectionStatus.completed)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    );

  if (completed.length === 0) return ComplianceStatus.PENDING;

  const latest = completed[0]!;
  if (latest.items.some((i) => i.result === InspectionItemResult.fail)) {
    return ComplianceStatus.FAIL;
  }
  if (latest.items.some((i) => i.result === InspectionItemResult.pending)) {
    return ComplianceStatus.PENDING;
  }
  if (latest.items.length === 0) return ComplianceStatus.PENDING;
  if (
    latest.items.every(
      (i) =>
        i.result === InspectionItemResult.pass ||
        i.result === InspectionItemResult.na,
    )
  ) {
    return ComplianceStatus.PASS;
  }

  return ComplianceStatus.PENDING;
}

/** Per-inspection compliance for history rows (completed inspections only). */
export function inspectionRowCompliance(
  inspection: Pick<InspectionForCompliance, "status" | "items">,
): ComplianceStatus {
  if (inspection.status !== InspectionStatus.completed) {
    return ComplianceStatus.PENDING;
  }
  if (inspection.items.some((i) => i.result === InspectionItemResult.fail)) {
    return ComplianceStatus.FAIL;
  }
  if (inspection.items.some((i) => i.result === InspectionItemResult.pending)) {
    return ComplianceStatus.PENDING;
  }
  if (inspection.items.length === 0) return ComplianceStatus.PENDING;
  if (
    inspection.items.every(
      (i) =>
        i.result === InspectionItemResult.pass ||
        i.result === InspectionItemResult.na,
    )
  ) {
    return ComplianceStatus.PASS;
  }
  return ComplianceStatus.PENDING;
}
