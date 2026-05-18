import type { InspectionItemResult } from "@prisma/client";

export type ComplianceLevel = "pass" | "fail" | "warning" | "unknown";

type ItemResult = { result: InspectionItemResult };

type InspectionForCompliance = {
  status: string;
  completedAt?: Date | null;
  items: ItemResult[];
};

export function inspectionItemCompliance(
  items: ItemResult[],
): ComplianceLevel {
  if (items.length === 0) return "unknown";
  if (items.some((i) => i.result === "fail")) return "fail";
  if (items.some((i) => i.result === "pending")) return "warning";
  if (items.every((i) => i.result === "pass" || i.result === "na")) return "pass";
  return "warning";
}

export function buildingComplianceFromInspections(
  inspections: InspectionForCompliance[],
): ComplianceLevel {
  const completed = inspections
    .filter((i) => i.status === "completed")
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    );
  if (completed.length === 0) return "unknown";

  return inspectionItemCompliance(completed[0]!.items);
}
