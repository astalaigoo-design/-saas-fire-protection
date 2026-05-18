import type { ComplianceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inspectionRowCompliance } from "@/lib/buildings/compliance";
import { computeBuildingInspectionStats } from "@/lib/buildings/stats";

const buildingDetailSelect = {
  id: true,
  customerId: true,
  name: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  region: true,
  postalCode: true,
  country: true,
  buildingType: true,
  fireDistrict: true,
  notes: true,
  currentStatus: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      companyId: true,
    },
  },
  buildingNotes: {
    select: {
      id: true,
      body: true,
      authorName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.BuildingSelect;

export type BuildingDetailRecord = Prisma.BuildingGetPayload<{
  select: typeof buildingDetailSelect;
}>;

const buildingListSelect = {
  id: true,
  name: true,
  addressLine1: true,
  city: true,
  region: true,
  currentStatus: true,
  customer: { select: { id: true, name: true } },
} satisfies Prisma.BuildingSelect;

export type BuildingListItem = Prisma.BuildingGetPayload<{
  select: typeof buildingListSelect;
}>;

export async function listCompanyBuildings(
  companyId: string,
): Promise<BuildingListItem[]> {
  return prisma.building.findMany({
    where: { customer: { companyId } },
    orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
    select: buildingListSelect,
  });
}

const inspectionWithRelationsSelect = {
  id: true,
  scheduledAt: true,
  completedAt: true,
  status: true,
  notes: true,
  inspectionType: { select: { id: true, name: true, code: true } },
  assignedTo: { select: { id: true, name: true } },
  items: { select: { result: true } },
  photos: {
    select: {
      id: true,
      url: true,
      caption: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
  reports: {
    select: {
      id: true,
      title: true,
      storageUrl: true,
      status: true,
      generatedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.InspectionSelect;

export type BuildingInspectionRecord = Prisma.InspectionGetPayload<{
  select: typeof inspectionWithRelationsSelect;
}>;

export type BuildingInspectionRow = BuildingInspectionRecord & {
  compliance: ComplianceStatus;
};

export type BuildingDetailPageData = {
  building: BuildingDetailRecord;
  inspections: BuildingInspectionRow[];
  stats: {
    compliance: ComplianceStatus;
    nextScheduledAt: Date | null;
    lastCompletedAt: Date | null;
    completedCount: number;
  };
};

export async function getBuildingById(
  companyId: string,
  buildingId: string,
): Promise<BuildingDetailRecord | null> {
  return prisma.building.findFirst({
    where: {
      id: buildingId,
      customer: { companyId },
    },
    select: buildingDetailSelect,
  });
}

export async function getBuildingDetailPageData(
  companyId: string,
  buildingId: string,
): Promise<BuildingDetailPageData | null> {
  const building = await getBuildingById(companyId, buildingId);
  if (!building) return null;

  const inspections = await prisma.inspection.findMany({
    where: { companyId, buildingId },
    orderBy: [{ scheduledAt: "desc" }],
    select: inspectionWithRelationsSelect,
  });

  const inspectionsWithCompliance: BuildingInspectionRow[] = inspections.map((inspection) => ({
    ...inspection,
    compliance: inspectionRowCompliance(inspection),
  }));

  const completed = inspections.filter((i) => i.status === "completed");
  const inspectionStats = computeBuildingInspectionStats(inspections);

  const lastCompleted = completed
    .filter((i) => i.completedAt)
    .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()))[0];

  return {
    building,
    inspections: inspectionsWithCompliance,
    stats: {
      ...inspectionStats,
      lastCompletedAt: lastCompleted?.completedAt ?? null,
    },
  };
}
