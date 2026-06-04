import { DeficiencyStatus } from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
} from "@/lib/branches/scope";
import { buildingLabel } from "@/lib/customers/format";
import { OPEN_DEFICIENCY_STATUSES } from "@/lib/deficiencies/status";
import { backfillDeficienciesForCompany } from "@/lib/deficiencies/create-from-inspection";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type DeficiencyRow = {
  id: string;
  label: string;
  description: string | null;
  notes: string | null;
  status: DeficiencyStatus;
  dueAt: Date | null;
  createdAt: Date;
  resolvedAt: Date | null;
  verifiedAt: Date | null;
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  inspectionTypeName: string;
  sourceInspectionId: string;
  sourceCompletedAt: Date | null;
  assignedTo: { id: string; name: string | null } | null;
  quoteId: string | null;
  quoteStatus: string | null;
};

const deficiencySelect = {
  id: true,
  label: true,
  description: true,
  notes: true,
  status: true,
  dueAt: true,
  createdAt: true,
  resolvedAt: true,
  verifiedAt: true,
  buildingId: true,
  sourceInspectionId: true,
  assignedTo: { select: { id: true, name: true } },
  sourceInspection: {
    select: {
      completedAt: true,
      inspectionType: { select: { name: true } },
      building: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true } },
        },
      },
      quote: { select: { id: true, status: true } },
    },
  },
} as const;

type DeficiencyQueryRow = {
  id: string;
  label: string;
  description: string | null;
  notes: string | null;
  status: DeficiencyStatus;
  dueAt: Date | null;
  createdAt: Date;
  resolvedAt: Date | null;
  verifiedAt: Date | null;
  buildingId: string;
  sourceInspectionId: string;
  assignedTo: { id: string; name: string | null } | null;
  sourceInspection: {
    completedAt: Date | null;
    inspectionType: { name: string };
    building: {
      id: string;
      name: string | null;
      addressLine1: string;
      city: string;
      customer: { name: string };
    };
    quote: { id: string; status: string } | null;
  };
};

function mapDeficiencyRow(row: DeficiencyQueryRow): DeficiencyRow {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    notes: row.notes,
    status: row.status,
    dueAt: row.dueAt,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    verifiedAt: row.verifiedAt,
    buildingId: row.buildingId,
    buildingLabel: buildingLabel(row.sourceInspection.building),
    customerName: row.sourceInspection.building.customer.name,
    inspectionTypeName: row.sourceInspection.inspectionType.name,
    sourceInspectionId: row.sourceInspectionId,
    sourceCompletedAt: row.sourceInspection.completedAt,
    assignedTo: row.assignedTo,
    quoteId: row.sourceInspection.quote?.id ?? null,
    quoteStatus: row.sourceInspection.quote?.status ?? null,
  };
}

export async function listOpenDeficiencies(
  session: DashboardSession,
  options?: { limit?: number; buildingId?: string },
): Promise<DeficiencyRow[]> {
  await backfillDeficienciesForCompany(session.companyId);

  const scope = branchScopeFromSession(session);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);

  const rows = await prisma.deficiency.findMany({
    where: {
      companyId: session.companyId,
      status: { in: OPEN_DEFICIENCY_STATUSES },
      building: {
        ...buildingWhere,
        ...(options?.buildingId ? { id: options.buildingId } : {}),
      },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: options?.limit ?? 100,
    select: deficiencySelect,
  });

  return rows.map(mapDeficiencyRow);
}

export async function listDeficienciesForBuilding(
  session: DashboardSession,
  buildingId: string,
): Promise<{ open: DeficiencyRow[]; verified: DeficiencyRow[] }> {
  const open = await listOpenDeficiencies(session, { buildingId, limit: 50 });

  const scope = branchScopeFromSession(session);
  const verified = await prisma.deficiency.findMany({
    where: {
      companyId: session.companyId,
      buildingId,
      status: DeficiencyStatus.verified,
      building: buildingWhereFromScope(scope, session.companyId),
    },
    orderBy: { verifiedAt: "desc" },
    take: 20,
    select: deficiencySelect,
  });

  return {
    open,
    verified: verified.map(mapDeficiencyRow),
  };
}

export async function countOpenDeficiencies(session: DashboardSession): Promise<number> {
  await backfillDeficienciesForCompany(session.companyId);

  const scope = branchScopeFromSession(session);
  return prisma.deficiency.count({
    where: {
      companyId: session.companyId,
      status: { in: OPEN_DEFICIENCY_STATUSES },
      building: buildingWhereFromScope(scope, session.companyId),
    },
  });
}

export async function listAssignableStaff(session: DashboardSession) {
  return prisma.user.findMany({
    where: {
      companyId: session.companyId,
      active: true,
      deletedAt: null,
      role: { in: ["owner", "admin", "technician"] },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });
}
