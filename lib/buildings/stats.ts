import type { ComplianceStatus } from "@prisma/client";
import {
  deriveBuildingComplianceStatus,
  type InspectionForCompliance,
} from "@/lib/buildings/compliance";

export type InspectionStatsInput = InspectionForCompliance;

export type BuildingInspectionStats = {
  compliance: ComplianceStatus;
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
    compliance: deriveBuildingComplianceStatus(inspections),
    nextScheduledAt: upcoming[0]?.scheduledAt ?? null,
    completedCount: completed.length,
  };
}
