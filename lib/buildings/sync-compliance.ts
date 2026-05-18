import { ComplianceStatus } from "@prisma/client";
import {
  deriveBuildingComplianceStatus,
  inspectionForComplianceSelect,
} from "@/lib/buildings/compliance";
import { prisma } from "@/lib/prisma";

/** Recompute and persist Building.currentStatus from inspection data. */
export async function syncBuildingComplianceStatus(
  buildingId: string,
): Promise<ComplianceStatus> {
  const inspections = await prisma.inspection.findMany({
    where: { buildingId },
    select: inspectionForComplianceSelect,
  });

  const currentStatus = deriveBuildingComplianceStatus(inspections);

  await prisma.building.update({
    where: { id: buildingId },
    data: { currentStatus },
  });

  return currentStatus;
}
