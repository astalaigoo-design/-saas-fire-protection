import type { ComplianceStatus, Prisma } from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { listBuildingAssetAuditHistory } from "@/lib/assets/audit-history";
import {
  listBuildingAssets,
  listInactiveBuildingAssets,
  type BuildingAssetRow,
} from "@/lib/assets/queries";
import type { AuditEventForDisplay } from "@/lib/audit/format-event";
import {
  listDeficienciesForBuilding,
  listAssignableStaff,
} from "@/lib/deficiencies/queries";
import { prisma } from "@/lib/prisma";
import { inspectionRowCompliance } from "@/lib/buildings/compliance";
import { computeBuildingInspectionStats } from "@/lib/buildings/stats";
import {
  computeDefaultNextServiceDue,
  getBranchAssetDefaults,
  type BranchAssetDefaults,
} from "@/lib/branches/asset-defaults";
import { toDateInputValue } from "@/lib/scheduling/calendar";

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
  permitNumber: true,
  permitExpiresAt: true,
  notes: true,
  currentStatus: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      companyId: true,
      branchId: true,
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
  fireDistrict: true,
  permitNumber: true,
  permitExpiresAt: true,
  currentStatus: true,
  customer: { select: { id: true, name: true } },
} satisfies Prisma.BuildingSelect;

export type BuildingListItem = Prisma.BuildingGetPayload<{
  select: typeof buildingListSelect;
}>;

export async function listCompanyBuildings(
  session: DashboardSession,
): Promise<BuildingListItem[]> {
  const scope = branchScopeFromSession(session);
  return prisma.building.findMany({
    where: buildingWhereFromScope(scope, session.companyId),
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
      shareToken: true,
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

export type BuildingAssetFormDefaults = {
  assetType?: BranchAssetDefaults["defaultAssetType"];
  nextServiceDue?: string;
};

export type BuildingDetailPageData = {
  building: BuildingDetailRecord;
  inspections: BuildingInspectionRow[];
  assets: BuildingAssetRow[];
  inactiveAssets: BuildingAssetRow[];
  assetAuditHistory: AuditEventForDisplay[];
  assetFormDefaults: BuildingAssetFormDefaults;
  deficiencies: Awaited<ReturnType<typeof listDeficienciesForBuilding>>;
  assignableStaff: Awaited<ReturnType<typeof listAssignableStaff>>;
  stats: {
    compliance: ComplianceStatus;
    nextScheduledAt: Date | null;
    lastCompletedAt: Date | null;
    completedCount: number;
    openDeficiencyCount: number;
  };
};

export async function getBuildingById(
  session: DashboardSession,
  buildingId: string,
): Promise<BuildingDetailRecord | null> {
  const scope = branchScopeFromSession(session);
  return prisma.building.findFirst({
    where: {
      id: buildingId,
      ...buildingWhereFromScope(scope, session.companyId),
    },
    select: buildingDetailSelect,
  });
}

export async function getBuildingDetailPageData(
  session: DashboardSession,
  buildingId: string,
): Promise<BuildingDetailPageData | null> {
  const building = await getBuildingById(session, buildingId);
  if (!building) return null;

  const [inspections, assets, inactiveAssets, assetAuditHistory, deficiencies, assignableStaff, branchDefaults] =
    await Promise.all([
      prisma.inspection.findMany({
        where: { companyId: session.companyId, buildingId },
        orderBy: [{ scheduledAt: "desc" }],
        select: inspectionWithRelationsSelect,
      }),
      listBuildingAssets(session, buildingId),
      listInactiveBuildingAssets(session, buildingId),
      listBuildingAssetAuditHistory(session, buildingId),
      listDeficienciesForBuilding(session, buildingId),
      listAssignableStaff(session),
      getBranchAssetDefaults(building.customer.branchId),
    ]);

  const assetFormDefaults: BuildingAssetFormDefaults = {};
  if (branchDefaults?.defaultAssetType) {
    assetFormDefaults.assetType = branchDefaults.defaultAssetType;
  }
  const defaultDue = computeDefaultNextServiceDue({
    lastServiceAt: null,
    intervalMonths: branchDefaults?.defaultServiceIntervalMonths ?? null,
  });
  if (defaultDue) {
    assetFormDefaults.nextServiceDue = toDateInputValue(defaultDue);
  }

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
    assets,
    inactiveAssets,
    assetAuditHistory,
    assetFormDefaults,
    deficiencies,
    assignableStaff,
    stats: {
      ...inspectionStats,
      lastCompletedAt: lastCompleted?.completedAt ?? null,
      openDeficiencyCount: deficiencies.open.length,
    },
  };
}
