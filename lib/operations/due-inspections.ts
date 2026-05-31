import type { RecurrenceInterval } from "@prisma/client";
import { calculateNextInspectionDue } from "@/lib/reports/next-inspection-due";

export const DUE_SOON_DAYS = 14;

export const CADENCE_TYPE_CODES = ["monthly", "quarterly", "annual"] as const;
export type CadenceTypeCode = (typeof CADENCE_TYPE_CODES)[number];

export type DueInspectionStatus = "overdue" | "due_soon" | "never_inspected";

export type DueInspectionRow = {
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  inspectionTypeCode: string;
  inspectionTypeName: string;
  status: DueInspectionStatus;
  dueAt: Date | null;
  lastCompletedAt: Date | null;
  scheduledInspectionId: string | null;
};

type InspectionSnapshot = {
  id: string;
  buildingId: string;
  status: string;
  scheduledAt: Date;
  completedAt: Date | null;
  recurrenceInterval: RecurrenceInterval | null;
  inspectionType: { code: string; name: string };
};

function buildingLabel(input: {
  name: string | null;
  addressLine1: string;
  city: string;
}): string {
  return input.name?.trim() || `${input.addressLine1}, ${input.city}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function computeDueInspections(input: {
  buildings: {
    id: string;
    name: string | null;
    addressLine1: string;
    city: string;
    customer: { name: string };
  }[];
  inspections: InspectionSnapshot[];
  typeCodes?: readonly string[];
  now?: Date;
}): DueInspectionRow[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const dueSoonCutoff = addDays(today, DUE_SOON_DAYS);
  const codes = input.typeCodes ?? CADENCE_TYPE_CODES;
  const rows: DueInspectionRow[] = [];

  for (const building of input.buildings) {
    const buildingInspections = input.inspections.filter((i) => i.buildingId === building.id);
    const label = buildingLabel(building);

    for (const code of codes) {
      const typeInspections = buildingInspections.filter((i) => i.inspectionType.code === code);
      const typeName =
        typeInspections[0]?.inspectionType.name ??
        code.charAt(0).toUpperCase() + code.slice(1);

      if (typeInspections.length === 0) {
        rows.push({
          buildingId: building.id,
          buildingLabel: label,
          customerName: building.customer.name,
          inspectionTypeCode: code,
          inspectionTypeName: typeName,
          status: "never_inspected",
          dueAt: null,
          lastCompletedAt: null,
          scheduledInspectionId: null,
        });
        continue;
      }

      const openVisits = typeInspections.filter(
        (i) => i.status === "scheduled" || i.status === "in_progress",
      );
      const futureScheduled = openVisits
        .filter((i) => i.scheduledAt >= today)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];

      if (futureScheduled) continue;

      const overdueVisit = openVisits
        .filter((i) => i.scheduledAt < today)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];

      if (overdueVisit) {
        rows.push({
          buildingId: building.id,
          buildingLabel: label,
          customerName: building.customer.name,
          inspectionTypeCode: code,
          inspectionTypeName: typeName,
          status: "overdue",
          dueAt: overdueVisit.scheduledAt,
          lastCompletedAt: null,
          scheduledInspectionId: overdueVisit.id,
        });
        continue;
      }

      const lastCompleted = typeInspections
        .filter((i) => i.status === "completed" && i.completedAt)
        .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0];

      if (!lastCompleted?.completedAt) {
        rows.push({
          buildingId: building.id,
          buildingLabel: label,
          customerName: building.customer.name,
          inspectionTypeCode: code,
          inspectionTypeName: typeName,
          status: "never_inspected",
          dueAt: null,
          lastCompletedAt: null,
          scheduledInspectionId: null,
        });
        continue;
      }

      const dueAt = calculateNextInspectionDue(
        lastCompleted.completedAt,
        lastCompleted.recurrenceInterval,
        code,
      );

      if (dueAt < today) {
        rows.push({
          buildingId: building.id,
          buildingLabel: label,
          customerName: building.customer.name,
          inspectionTypeCode: code,
          inspectionTypeName: typeName,
          status: "overdue",
          dueAt,
          lastCompletedAt: lastCompleted.completedAt,
          scheduledInspectionId: null,
        });
      } else if (dueAt <= dueSoonCutoff) {
        rows.push({
          buildingId: building.id,
          buildingLabel: label,
          customerName: building.customer.name,
          inspectionTypeCode: code,
          inspectionTypeName: typeName,
          status: "due_soon",
          dueAt,
          lastCompletedAt: lastCompleted.completedAt,
          scheduledInspectionId: null,
        });
      }
    }
  }

  const statusOrder: Record<DueInspectionStatus, number> = {
    overdue: 0,
    never_inspected: 1,
    due_soon: 2,
  };

  return rows.sort((a, b) => {
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus !== 0) return byStatus;
    const aTime = a.dueAt?.getTime() ?? 0;
    const bTime = b.dueAt?.getTime() ?? 0;
    return aTime - bTime;
  });
}

export function groupDueByCadence(rows: DueInspectionRow[]) {
  return {
    monthly: rows.filter((row) => row.inspectionTypeCode === "monthly"),
    quarterly: rows.filter((row) => row.inspectionTypeCode === "quarterly"),
    annual: rows.filter((row) => row.inspectionTypeCode === "annual"),
  };
}
