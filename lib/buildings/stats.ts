import type { InspectionItemResult } from "@prisma/client";
import {
  buildingComplianceFromInspections,
  type ComplianceLevel,
} from "@/lib/buildings/compliance";

export type InspectionStatsInput = {
  status: string;
  scheduledAt: Date;
  completedAt: Date | null;
  items: { result: InspectionItemResult }[];
};

export type BuildingInspectionStats = {
  compliance: ComplianceLevel;
  nextScheduledAt: Date | null;
  completedCount: number;
};

export function computeBuildingInspectionStats(
  inspections: InspectionStatsInput[],
): BuildingInspectionStats {
  const completed = inspections.filter((i) => i.status === "completed");
  const now = new Date();
  const upcoming = inspections
    .filter((i) => i.status === "scheduled" || i.status === "in_progress")
    .filter((i) => i.scheduledAt >= now)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return {
    compliance: buildingComplianceFromInspections(inspections),
    nextScheduledAt: upcoming[0]?.scheduledAt ?? null,
    completedCount: completed.length,
  };
}
