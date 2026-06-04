import {
  branchScopeFromSession,
  buildingWhereFromScope,
} from "@/lib/branches/scope";
import { buildingLabel } from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const IMPORT_LOOKBACK_DAYS = 90;

export type ImportHealthBuildingGap = {
  buildingId: string;
  buildingLabel: string;
  customerName: string;
};

export type ImportHealthSnapshot = {
  buildingsInScope: number;
  buildingsWithoutRegister: number;
  activeAssets: number;
  assetsMissingNextDue: number;
  recentImports: {
    customers: number;
    buildings: number;
    equipment: number;
    scheduleJobs: number;
  };
  lastImportAt: Date | null;
  registerGaps: ImportHealthBuildingGap[];
};

function importSince(): Date {
  const since = new Date();
  since.setDate(since.getDate() - IMPORT_LOOKBACK_DAYS);
  return since;
}

async function countCsvImports(
  companyId: string,
  action: string,
  source: string,
  since: Date,
): Promise<number> {
  return prisma.auditEvent.count({
    where: {
      companyId,
      action,
      createdAt: { gte: since },
      metadata: { path: ["source"], equals: source },
    },
  });
}

export async function getImportHealthSnapshot(
  session: DashboardSession,
): Promise<ImportHealthSnapshot> {
  const scope = branchScopeFromSession(session);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);
  const since = importSince();

  const [
    buildingsInScope,
    buildingsWithoutRegister,
    activeAssets,
    assetsMissingNextDue,
    registerGapRows,
    customersImported,
    buildingsImported,
    equipmentImported,
    scheduleJobsImported,
    lastImport,
  ] = await Promise.all([
    prisma.building.count({ where: buildingWhere }),
    prisma.building.count({
      where: {
        ...buildingWhere,
        assets: { none: { active: true } },
      },
    }),
    prisma.buildingAsset.count({
      where: { active: true, building: buildingWhere },
    }),
    prisma.buildingAsset.count({
      where: {
        active: true,
        nextServiceDue: null,
        building: buildingWhere,
      },
    }),
    prisma.building.findMany({
      where: {
        ...buildingWhere,
        assets: { none: { active: true } },
      },
      select: {
        id: true,
        name: true,
        addressLine1: true,
        city: true,
        customer: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    countCsvImports(session.companyId, "customer.created", "customer_csv_import", since),
    countCsvImports(session.companyId, "building.created", "csv_import", since),
    countCsvImports(session.companyId, "asset.created", "asset_csv_import", since),
    countCsvImports(
      session.companyId,
      "inspection.scheduled",
      "schedule_csv_import",
      since,
    ),
    prisma.auditEvent.findFirst({
      where: {
        companyId: session.companyId,
        OR: [
          { metadata: { path: ["source"], equals: "customer_csv_import" } },
          { metadata: { path: ["source"], equals: "csv_import" } },
          { metadata: { path: ["source"], equals: "asset_csv_import" } },
          { metadata: { path: ["source"], equals: "schedule_csv_import" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    buildingsInScope,
    buildingsWithoutRegister,
    activeAssets,
    assetsMissingNextDue,
    recentImports: {
      customers: customersImported,
      buildings: buildingsImported,
      equipment: equipmentImported,
      scheduleJobs: scheduleJobsImported,
    },
    lastImportAt: lastImport?.createdAt ?? null,
    registerGaps: registerGapRows.map((row) => ({
      buildingId: row.id,
      buildingLabel: buildingLabel(row),
      customerName: row.customer.name,
    })),
  };
}
