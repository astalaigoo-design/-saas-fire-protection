import type { Prisma } from "@prisma/client";
import { canViewAllJobs } from "@/lib/auth/permissions";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { ensureInspectionAssetChecks } from "@/lib/inspect/ensure-asset-checks";
import { prisma } from "@/lib/prisma";

const inspectionFormSelect = {
  id: true,
  buildingId: true,
  status: true,
  scheduledAt: true,
  startedAt: true,
  arrivedAt: true,
  arrivalLatitude: true,
  arrivalLongitude: true,
  arrivalAccuracyMeters: true,
  completedAt: true,
  submitLatitude: true,
  submitLongitude: true,
  submitAccuracyMeters: true,
  mileageMiles: true,
  signatureData: true,
  signedAt: true,
  notes: true,
  building: {
    select: {
      name: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postalCode: true,
      customer: { select: { name: true } },
    },
  },
  inspectionType: { select: { name: true } },
  items: {
    select: {
      id: true,
      label: true,
      description: true,
      linkedTagNumber: true,
      sortOrder: true,
      result: true,
      notes: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
  assetChecks: {
    select: {
      id: true,
      result: true,
      notes: true,
      servicedAt: true,
      buildingAsset: {
        select: {
          id: true,
          assetType: true,
          tagNumber: true,
          barcodeValue: true,
          location: true,
          manufacturer: true,
          model: true,
        },
      },
    },
    orderBy: { buildingAsset: { location: "asc" } },
  },
  photos: {
    select: { id: true, url: true, caption: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.InspectionSelect;

export type InspectionFormData = Prisma.InspectionGetPayload<{
  select: typeof inspectionFormSelect;
}>;

export function isInspectionLocked(inspection: Pick<InspectionFormData, "status">): boolean {
  return inspection.status === "completed" || inspection.status === "cancelled";
}

export async function getInspectionForForm(
  session: DashboardSession,
  inspectionId: string,
): Promise<InspectionFormData | null> {
  const scope = branchScopeFromSession(session);
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      ...inspectionWhereFromScope(scope, session.companyId),
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    select: inspectionFormSelect,
  });

  if (!inspection) return null;

  if (!isInspectionLocked(inspection)) {
    await ensureInspectionAssetChecks(inspection.id, inspection.buildingId);
    return prisma.inspection.findFirst({
      where: { id: inspectionId },
      select: inspectionFormSelect,
    });
  }

  return inspection;
}
