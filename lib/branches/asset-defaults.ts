import type { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BranchAssetDefaults = {
  defaultAssetType: AssetType | null;
  defaultServiceIntervalMonths: number | null;
};

export function addMonths(base: Date, months: number): Date {
  const result = new Date(base);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function computeDefaultNextServiceDue(input: {
  lastServiceAt: Date | null;
  intervalMonths: number | null;
}): Date | null {
  if (!input.intervalMonths || input.intervalMonths < 1 || input.intervalMonths > 60) {
    return null;
  }
  const base = input.lastServiceAt ?? new Date();
  return addMonths(base, input.intervalMonths);
}

export async function getBranchAssetDefaults(
  branchId: string,
): Promise<BranchAssetDefaults | null> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      defaultAssetType: true,
      defaultServiceIntervalMonths: true,
    },
  });
  if (!branch) return null;
  return {
    defaultAssetType: branch.defaultAssetType,
    defaultServiceIntervalMonths: branch.defaultServiceIntervalMonths,
  };
}
