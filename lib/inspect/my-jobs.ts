import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import {
  buildingLabel,
  buildingMapsSearchQuery,
} from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { sortTechnicianJobs } from "@/lib/inspect/resume-job";
import type { JobCatalogEntry } from "@/lib/offline/job-catalog";
import { prisma } from "@/lib/prisma";

const myJobBuildingSelect = {
  name: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  region: true,
  postalCode: true,
  country: true,
  customer: { select: { name: true } },
} as const;

export type MyAssignedInspectionRow = {
  id: string;
  scheduledAt: Date;
  status: string;
  building: {
    name: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    customer: { name: string };
  };
  inspectionType: { name: string };
};

export function toJobCatalogEntry(job: MyAssignedInspectionRow): JobCatalogEntry {
  const mapsQuery = buildingMapsSearchQuery(job.building);
  return {
    inspectionId: job.id,
    label: buildingLabel(job.building),
    subtitle: `${job.building.customer.name} · ${job.inspectionType.name}`,
    scheduledAt: job.scheduledAt.toISOString(),
    status: job.status as "scheduled" | "in_progress",
    addressLine: mapsQuery,
    mapsQuery,
  };
}

export async function getMyAssignedInspections(session: DashboardSession) {
  const scope = branchScopeFromSession(session);
  const rows = await prisma.inspection.findMany({
    where: {
      ...inspectionWhereFromScope(scope, session.companyId),
      assignedToUserId: session.appUserId,
      status: { in: ["scheduled", "in_progress"] },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      building: { select: myJobBuildingSelect },
      inspectionType: { select: { name: true } },
    },
  });

  return sortTechnicianJobs(rows);
}
