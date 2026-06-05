import { AssetType, type Prisma } from "@prisma/client";
import { WATER_SYSTEM_ASSET_TYPES } from "@/lib/assets/constants";
import { addMonths } from "@/lib/branches/asset-defaults";
import { prisma } from "@/lib/prisma";

/** Default test intervals (months) seeded for water-system asset types. */
export const DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS: Record<
  (typeof WATER_SYSTEM_ASSET_TYPES)[number],
  number
> = {
  [AssetType.fire_hydrant]: 12,
  [AssetType.standpipe]: 12,
  [AssetType.sprinkler_component]: 3,
};

export type BranchServiceIntervalMap = Map<AssetType, number>;

export function nextServiceDueFromInterval(
  lastServiceAt: Date,
  intervalMonths: number,
): Date | null {
  if (intervalMonths < 1 || intervalMonths > 60) return null;
  return addMonths(lastServiceAt, intervalMonths);
}

export async function getBranchServiceIntervalMap(
  branchId: string,
): Promise<BranchServiceIntervalMap> {
  const rows = await prisma.branchAssetServiceInterval.findMany({
    where: { branchId },
    select: { assetType: true, intervalMonths: true },
  });
  return new Map(rows.map((row) => [row.assetType, row.intervalMonths]));
}

export async function getBranchServiceIntervalsForCompany(
  companyId: string,
): Promise<Map<string, BranchServiceIntervalMap>> {
  const rows = await prisma.branchAssetServiceInterval.findMany({
    where: { branch: { companyId } },
    select: { branchId: true, assetType: true, intervalMonths: true },
  });

  const byBranch = new Map<string, BranchServiceIntervalMap>();
  for (const row of rows) {
    const map = byBranch.get(row.branchId) ?? new Map<AssetType, number>();
    map.set(row.assetType, row.intervalMonths);
    byBranch.set(row.branchId, map);
  }
  return byBranch;
}

export async function resolveServiceIntervalMonths(
  branchId: string,
  assetType: AssetType,
  intervalMap?: BranchServiceIntervalMap,
): Promise<number | null> {
  const map = intervalMap ?? (await getBranchServiceIntervalMap(branchId));
  const perType = map.get(assetType);
  if (perType != null) return perType;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { defaultServiceIntervalMonths: true },
  });
  return branch?.defaultServiceIntervalMonths ?? null;
}

export async function computeNextServiceDueForAsset(input: {
  branchId: string;
  assetType: AssetType;
  lastServiceAt: Date | null;
  intervalMap?: BranchServiceIntervalMap;
}): Promise<Date | null> {
  const intervalMonths = await resolveServiceIntervalMonths(
    input.branchId,
    input.assetType,
    input.intervalMap,
  );
  if (!intervalMonths) return null;
  const base = input.lastServiceAt ?? new Date();
  return nextServiceDueFromInterval(base, intervalMonths);
}

export async function seedBranchWaterSystemIntervals(
  branchId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  const now = new Date();

  await client.branchAssetServiceInterval.createMany({
    data: WATER_SYSTEM_ASSET_TYPES.map((assetType) => ({
      branchId,
      assetType,
      intervalMonths: DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS[assetType],
      updatedAt: now,
    })),
    skipDuplicates: true,
  });
}

export async function upsertBranchServiceIntervals(
  branchId: string,
  intervals: { assetType: AssetType; intervalMonths: number }[],
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  const now = new Date();
  await Promise.all(
    intervals.map((row) =>
      client.branchAssetServiceInterval.upsert({
        where: {
          branchId_assetType: { branchId, assetType: row.assetType },
        },
        create: {
          branchId,
          assetType: row.assetType,
          intervalMonths: row.intervalMonths,
          updatedAt: now,
        },
        update: {
          intervalMonths: row.intervalMonths,
          updatedAt: now,
        },
      }),
    ),
  );
}
