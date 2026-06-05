import type { AssetType } from "@prisma/client";
import { WATER_SYSTEM_ASSET_TYPES } from "@/lib/assets/constants";
import type { DashboardSession } from "@/lib/dashboard/session";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";
import { prisma } from "@/lib/prisma";

export type BranchWaterSystemInterval = {
  assetType: (typeof WATER_SYSTEM_ASSET_TYPES)[number];
  intervalMonths: number;
};

export type BranchListItem = {
  id: string;
  name: string;
  isDefault: boolean;
  isImportDefault: boolean;
  defaultAssetType: AssetType | null;
  defaultServiceIntervalMonths: number | null;
  waterSystemIntervals: BranchWaterSystemInterval[];
  customerCount: number;
};

export async function listBranchesForCompany(companyId: string): Promise<BranchListItem[]> {
  const rows = await prisma.branch.findMany({
    where: { companyId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      isImportDefault: true,
      defaultAssetType: true,
      defaultServiceIntervalMonths: true,
      assetServiceIntervals: {
        where: { assetType: { in: [...WATER_SYSTEM_ASSET_TYPES] } },
        select: { assetType: true, intervalMonths: true },
      },
      _count: { select: { customers: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    isImportDefault: row.isImportDefault,
    defaultAssetType: row.defaultAssetType,
    defaultServiceIntervalMonths: row.defaultServiceIntervalMonths,
    waterSystemIntervals: row.assetServiceIntervals
      .filter((interval): interval is BranchWaterSystemInterval =>
        WATER_SYSTEM_ASSET_TYPES.includes(
          interval.assetType as BranchWaterSystemInterval["assetType"],
        ),
      )
      .map((interval) => ({
        assetType: interval.assetType as BranchWaterSystemInterval["assetType"],
        intervalMonths: interval.intervalMonths,
      })),
    customerCount: row._count.customers,
  }));
}

export async function getBranchSwitcherData(session: DashboardSession) {
  const branches = await listBranchesForCompany(session.companyId);
  const canSwitch = canFilterBranchesByCookie(session) && branches.length > 1;
  return {
    branches,
    canSwitch,
    activeBranchId: session.activeBranchId,
    label:
      session.activeBranchId != null
        ? (branches.find((b) => b.id === session.activeBranchId)?.name ?? "Branch")
        : "All locations",
  };
}

export async function listBranchesForCustomerForm(session: DashboardSession) {
  const branches = await listBranchesForCompany(session.companyId);

  if (canFilterBranchesByCookie(session)) {
    const defaultBranch =
      branches.find((b) => b.id === session.activeBranchId) ??
      branches.find((b) => b.isDefault) ??
      branches[0] ??
      null;
    return { branches, defaultBranchId: defaultBranch?.id ?? null };
  }

  const assigned = session.userBranchId
    ? branches.filter((b) => b.id === session.userBranchId)
    : branches.filter((b) => b.isDefault).slice(0, 1);

  return {
    branches: assigned,
    defaultBranchId: assigned[0]?.id ?? null,
  };
}
