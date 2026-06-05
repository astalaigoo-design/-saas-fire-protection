import {
  branchScopeFromSession,
  buildingWhereFromScope,
} from "@/lib/branches/scope";
import { buildingLabel } from "@/lib/customers/format";
import {
  computePermitStatus,
  permitStatusNeedsAttention,
  type PermitStatus,
} from "@/lib/buildings/permit-status";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type PermitTrackingRow = {
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  fireDistrict: string | null;
  permitNumber: string | null;
  permitExpiresAt: Date | null;
  status: PermitStatus;
};

export type PermitTrackingTotals = {
  missing: number;
  expired: number;
  expiringSoon: number;
  noExpiryDate: number;
  current: number;
  needsAttention: number;
};

export function countPermitTotals(rows: PermitTrackingRow[]): PermitTrackingTotals {
  const totals: PermitTrackingTotals = {
    missing: 0,
    expired: 0,
    expiringSoon: 0,
    noExpiryDate: 0,
    current: 0,
    needsAttention: 0,
  };

  for (const row of rows) {
    switch (row.status) {
      case "missing":
        totals.missing += 1;
        break;
      case "expired":
        totals.expired += 1;
        break;
      case "expiring_soon":
        totals.expiringSoon += 1;
        break;
      case "no_expiry_date":
        totals.noExpiryDate += 1;
        break;
      case "current":
        totals.current += 1;
        break;
    }
    if (permitStatusNeedsAttention(row.status)) {
      totals.needsAttention += 1;
    }
  }

  return totals;
}

export function buildPermitTrackingRows(
  buildings: {
    id: string;
    name: string | null;
    addressLine1: string;
    city: string;
    fireDistrict: string | null;
    permitNumber: string | null;
    permitExpiresAt: Date | null;
    customer: { name: string };
  }[],
  now?: Date,
): PermitTrackingRow[] {
  return buildings
    .map((building) => ({
      buildingId: building.id,
      buildingLabel: buildingLabel(building),
      customerName: building.customer.name,
      fireDistrict: building.fireDistrict,
      permitNumber: building.permitNumber,
      permitExpiresAt: building.permitExpiresAt,
      status: computePermitStatus({
        permitNumber: building.permitNumber,
        permitExpiresAt: building.permitExpiresAt,
        now,
      }),
    }))
    .sort((a, b) => {
      const rank = (status: PermitStatus) => {
        switch (status) {
          case "expired":
            return 0;
          case "expiring_soon":
            return 1;
          case "no_expiry_date":
            return 2;
          case "missing":
            return 3;
          default:
            return 4;
        }
      };
      const byRank = rank(a.status) - rank(b.status);
      if (byRank !== 0) return byRank;
      const aTime = a.permitExpiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.permitExpiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}

export async function listPermitTrackingRows(
  session: DashboardSession,
): Promise<PermitTrackingRow[]> {
  const scope = branchScopeFromSession(session);
  const buildings = await prisma.building.findMany({
    where: buildingWhereFromScope(scope, session.companyId),
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
      fireDistrict: true,
      permitNumber: true,
      permitExpiresAt: true,
      customer: { select: { name: true } },
    },
    orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
  });

  return buildPermitTrackingRows(buildings);
}
