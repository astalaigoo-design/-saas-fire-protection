import { AssetType } from "@prisma/client";
import { WATER_SYSTEM_ASSET_TYPES } from "@/lib/assets/constants";

/** Days before next service due to flag as due soon. */
export const SYSTEM_TEST_DUE_SOON_DAYS = 60;

export type SystemTestStatus =
  | "not_registered"
  | "overdue"
  | "due_soon"
  | "missing_due_date"
  | "current";

export type SystemTestAssetSnapshot = {
  assetType: AssetType;
  nextServiceDue: Date | null;
  active: boolean;
};

export type SystemTestStatusByType = Record<
  (typeof WATER_SYSTEM_ASSET_TYPES)[number],
  SystemTestStatus
>;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function computeSystemTestStatusForType(
  assets: SystemTestAssetSnapshot[],
  assetType: AssetType,
  now = new Date(),
): SystemTestStatus {
  const rows = assets.filter((row) => row.active && row.assetType === assetType);
  if (rows.length === 0) return "not_registered";

  const today = startOfDay(now);
  const soonCutoff = addDays(today, SYSTEM_TEST_DUE_SOON_DAYS);

  let hasMissingDue = false;
  let hasOverdue = false;
  let hasDueSoon = false;

  for (const row of rows) {
    if (!row.nextServiceDue) {
      hasMissingDue = true;
      continue;
    }
    const due = startOfDay(row.nextServiceDue);
    if (due.getTime() < today.getTime()) {
      hasOverdue = true;
    } else if (due.getTime() <= soonCutoff.getTime()) {
      hasDueSoon = true;
    }
  }

  if (hasOverdue) return "overdue";
  if (hasDueSoon) return "due_soon";
  if (hasMissingDue) return "missing_due_date";
  return "current";
}

export function computeSystemTestStatusByType(
  assets: SystemTestAssetSnapshot[],
  now?: Date,
): SystemTestStatusByType {
  return {
    [AssetType.fire_hydrant]: computeSystemTestStatusForType(
      assets,
      AssetType.fire_hydrant,
      now,
    ),
    [AssetType.standpipe]: computeSystemTestStatusForType(assets, AssetType.standpipe, now),
    [AssetType.sprinkler_component]: computeSystemTestStatusForType(
      assets,
      AssetType.sprinkler_component,
      now,
    ),
  };
}

export function systemTestStatusLabel(status: SystemTestStatus): string {
  switch (status) {
    case "not_registered":
      return "Not on register";
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "missing_due_date":
      return "Missing due date";
    case "current":
      return "Current";
  }
}

export function systemTestStatusNeedsAttention(status: SystemTestStatus): boolean {
  return status !== "current" && status !== "not_registered";
}

export function classifyAssetServiceDueBadge(
  nextServiceDue: Date | null,
  now = new Date(),
): "overdue" | "due_soon" | null {
  if (!nextServiceDue) return null;
  const today = startOfDay(now);
  const due = startOfDay(nextServiceDue);
  if (due.getTime() < today.getTime()) return "overdue";
  const soonCutoff = addDays(today, SYSTEM_TEST_DUE_SOON_DAYS);
  if (due.getTime() <= soonCutoff.getTime()) return "due_soon";
  return null;
}
