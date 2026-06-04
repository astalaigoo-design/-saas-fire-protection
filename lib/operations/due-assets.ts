import { AssetType } from "@prisma/client";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingLabel } from "@/lib/customers/format";
import { getMonthRange } from "@/lib/dashboard/dates";

export type DueAssetStatus = "overdue" | "due_this_month";

export type DueAssetRow = {
  assetId: string;
  assetType: AssetType;
  assetTypeLabel: string;
  tagNumber: string | null;
  location: string;
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  status: DueAssetStatus;
  nextServiceDue: Date;
  lastServiceAt: Date | null;
};

export type DueAssetTotals = {
  equipmentOverdue: number;
  equipmentDueThisMonth: number;
  extinguishersOverdue: number;
  extinguishersDueThisMonth: number;
};

type AssetSnapshot = {
  id: string;
  assetType: AssetType;
  tagNumber: string | null;
  location: string;
  nextServiceDue: Date | null;
  lastServiceAt: Date | null;
  building: {
    id: string;
    name: string | null;
    addressLine1: string;
    city: string;
    customer: { name: string };
  };
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function classifyDueAsset(
  nextServiceDue: Date,
  now: Date,
  monthStart: Date,
  monthEnd: Date,
): DueAssetStatus | null {
  const due = startOfDay(nextServiceDue);
  const today = startOfDay(now);

  if (due < today) return "overdue";
  if (due >= monthStart && due < monthEnd) return "due_this_month";
  return null;
}

export function computeDueAssets(input: {
  assets: AssetSnapshot[];
  now?: Date;
  monthStart?: Date;
  monthEnd?: Date;
}): DueAssetRow[] {
  const now = input.now ?? new Date();
  const { start: defaultStart, end: defaultEnd } = getMonthRange(now);
  const monthStart = input.monthStart ?? defaultStart;
  const monthEnd = input.monthEnd ?? defaultEnd;

  const rows: DueAssetRow[] = [];

  for (const asset of input.assets) {
    if (!asset.nextServiceDue) continue;

    const status = classifyDueAsset(asset.nextServiceDue, now, monthStart, monthEnd);
    if (!status) continue;

    rows.push({
      assetId: asset.id,
      assetType: asset.assetType,
      assetTypeLabel: assetTypeLabel(asset.assetType),
      tagNumber: asset.tagNumber,
      location: asset.location,
      buildingId: asset.building.id,
      buildingLabel: buildingLabel(asset.building),
      customerName: asset.building.customer.name,
      status,
      nextServiceDue: asset.nextServiceDue,
      lastServiceAt: asset.lastServiceAt,
    });
  }

  const statusOrder: Record<DueAssetStatus, number> = {
    overdue: 0,
    due_this_month: 1,
  };

  return rows.sort((a, b) => {
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus !== 0) return byStatus;
    return a.nextServiceDue.getTime() - b.nextServiceDue.getTime();
  });
}

export function countDueAssetTotals(rows: DueAssetRow[]): DueAssetTotals {
  const overdue = rows.filter((row) => row.status === "overdue");
  const dueThisMonth = rows.filter((row) => row.status === "due_this_month");
  const extinguishers = (list: DueAssetRow[]) =>
    list.filter((row) => row.assetType === AssetType.fire_extinguisher);

  return {
    equipmentOverdue: overdue.length,
    equipmentDueThisMonth: dueThisMonth.length,
    extinguishersOverdue: extinguishers(overdue).length,
    extinguishersDueThisMonth:
      extinguishers(overdue).length + extinguishers(dueThisMonth).length,
  };
}

export function filterDueAssetsByType(
  rows: DueAssetRow[],
  assetType: AssetType,
): DueAssetRow[] {
  return rows.filter((row) => row.assetType === assetType);
}

export function groupDueAssetsByType(rows: DueAssetRow[]): {
  assetType: AssetType;
  assetTypeLabel: string;
  rows: DueAssetRow[];
}[] {
  const byType = new Map<AssetType, DueAssetRow[]>();
  for (const row of rows) {
    const list = byType.get(row.assetType) ?? [];
    list.push(row);
    byType.set(row.assetType, list);
  }

  return Array.from(byType.entries())
    .map(([assetType, typeRows]) => ({
      assetType,
      assetTypeLabel: typeRows[0]?.assetTypeLabel ?? assetTypeLabel(assetType),
      rows: typeRows,
    }))
    .sort((a, b) => a.assetTypeLabel.localeCompare(b.assetTypeLabel));
}
