import { InspectionItemResult, InspectionStatus } from "@prisma/client";
import { canViewAllJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import {
  buildingLabel,
  formatBuildingAddress,
} from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { listBuildingEquipmentPreview } from "@/lib/inspect/job-equipment";
import type { JobEquipmentPreviewRow } from "@/lib/inspect/job-equipment";
import { prisma } from "@/lib/prisma";

export type PreJobBriefDeficiency = {
  label: string;
  description: string | null;
  notes: string | null;
};

export type PreJobBrief = {
  buildingId: string;
  buildingLabel: string;
  buildingAddress: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  lastInspection: {
    completedAt: Date;
    inspectionTypeName: string;
  } | null;
  deficiencies: PreJobBriefDeficiency[];
  equipment: JobEquipmentPreviewRow[];
};

export type ClientPreJobBriefEquipmentRow = Omit<
  JobEquipmentPreviewRow,
  "lastServiceAt" | "nextServiceDue"
> & {
  lastServiceAt: string | null;
  nextServiceDue: string | null;
};

export type ClientPreJobBrief = Omit<PreJobBrief, "lastInspection" | "equipment"> & {
  lastInspection: {
    completedAt: string;
    inspectionTypeName: string;
  } | null;
  equipment: ClientPreJobBriefEquipmentRow[];
};

export function serializePreJobBrief(brief: PreJobBrief): ClientPreJobBrief {
  return {
    ...brief,
    lastInspection: brief.lastInspection
      ? {
          completedAt: brief.lastInspection.completedAt.toISOString(),
          inspectionTypeName: brief.lastInspection.inspectionTypeName,
        }
      : null,
    equipment: brief.equipment.map((row) => ({
      ...row,
      lastServiceAt: row.lastServiceAt?.toISOString() ?? null,
      nextServiceDue: row.nextServiceDue?.toISOString() ?? null,
    })),
  };
}

export function hydratePreJobBrief(brief: ClientPreJobBrief): PreJobBrief {
  return {
    ...brief,
    lastInspection: brief.lastInspection
      ? {
          completedAt: new Date(brief.lastInspection.completedAt),
          inspectionTypeName: brief.lastInspection.inspectionTypeName,
        }
      : null,
    equipment: brief.equipment.map((row) => ({
      ...row,
      lastServiceAt: row.lastServiceAt ? new Date(row.lastServiceAt) : null,
      nextServiceDue: row.nextServiceDue ? new Date(row.nextServiceDue) : null,
    })),
  };
}

export async function getPreJobBriefForInspection(
  session: DashboardSession,
  inspectionId: string,
): Promise<PreJobBrief | null> {
  const scope = branchScopeFromSession(session);
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      ...inspectionWhereFromScope(scope, session.companyId),
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    select: {
      buildingId: true,
      building: {
        select: {
          name: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          region: true,
          postalCode: true,
          country: true,
          customer: {
            select: { name: true, email: true, phone: true },
          },
        },
      },
    },
  });

  if (!inspection) return null;

  const priorInspection = await prisma.inspection.findFirst({
    where: {
      buildingId: inspection.buildingId,
      id: { not: inspectionId },
      status: InspectionStatus.completed,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      completedAt: true,
      inspectionType: { select: { name: true } },
      items: {
        where: { result: InspectionItemResult.fail },
        select: { label: true, description: true, notes: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const building = inspection.building;
  const equipment = await listBuildingEquipmentPreview(inspection.buildingId);

  return {
    buildingId: inspection.buildingId,
    buildingLabel: buildingLabel(building),
    buildingAddress: formatBuildingAddress(building),
    contactName: building.customer.name,
    contactEmail: building.customer.email?.trim() || null,
    contactPhone: building.customer.phone?.trim() || null,
    lastInspection: priorInspection?.completedAt
      ? {
          completedAt: priorInspection.completedAt,
          inspectionTypeName: priorInspection.inspectionType.name,
        }
      : null,
    deficiencies: (priorInspection?.items ?? []).map((item) => ({
      label: item.label,
      description: item.description,
      notes: item.notes,
    })),
    equipment,
  };
}
