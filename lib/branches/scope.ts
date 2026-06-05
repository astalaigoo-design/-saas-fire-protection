import type { Prisma } from "@prisma/client";
import { isOwner } from "@/lib/auth/permissions";
import type { DashboardSession } from "@/lib/dashboard/session";

/** Effective data filter for the current dashboard view. */
export type BranchScope =
  | { mode: "all" }
  | { mode: "branch"; branchId: string };

export function branchScopeFromSession(session: DashboardSession): BranchScope {
  if (canFilterBranchesByCookie(session)) {
    if (session.activeBranchId) {
      return { mode: "branch", branchId: session.activeBranchId };
    }
    return { mode: "all" };
  }

  if (session.userBranchId) {
    return { mode: "branch", branchId: session.userBranchId };
  }

  return { mode: "all" };
}

export function canFilterBranchesByCookie(session: DashboardSession): boolean {
  return isOwner(session.role);
}

export function customerWhereFromScope(
  scope: BranchScope,
  companyId: string,
): Prisma.CustomerWhereInput {
  const base: Prisma.CustomerWhereInput = { companyId };
  if (scope.mode === "all") return base;
  return { ...base, branchId: scope.branchId };
}

export function buildingWhereFromScope(
  scope: BranchScope,
  companyId: string,
): Prisma.BuildingWhereInput {
  if (scope.mode === "all") {
    return { customer: { companyId } };
  }
  return { customer: { companyId, branchId: scope.branchId } };
}

export function inspectionWhereFromScope(
  scope: BranchScope,
  companyId: string,
  extra?: Prisma.InspectionWhereInput,
): Prisma.InspectionWhereInput {
  const base: Prisma.InspectionWhereInput = { companyId, ...extra };
  if (scope.mode === "all") return base;
  return {
    ...base,
    building: { customer: { companyId, branchId: scope.branchId } },
  };
}

export function quoteWhereFromScope(
  scope: BranchScope,
  companyId: string,
): Prisma.QuoteWhereInput {
  const base: Prisma.QuoteWhereInput = { companyId };
  if (scope.mode === "all") return base;
  return {
    ...base,
    inspection: {
      building: { customer: { companyId, branchId: scope.branchId } },
    },
  };
}

export function workOrderWhereFromScope(
  scope: BranchScope,
  companyId: string,
  extra?: Prisma.WorkOrderWhereInput,
): Prisma.WorkOrderWhereInput {
  const base: Prisma.WorkOrderWhereInput = { companyId, ...extra };
  if (scope.mode === "all") return base;
  return {
    ...base,
    building: { customer: { companyId, branchId: scope.branchId } },
  };
}
