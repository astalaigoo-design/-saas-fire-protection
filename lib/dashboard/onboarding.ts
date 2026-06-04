import { InspectionStatus } from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
  customerWhereFromScope,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
  /** Shown in checklist but not required for "complete" (e.g. equipment register). */
  optional?: boolean;
};

export function requiredOnboardingSteps(steps: OnboardingStep[]): OnboardingStep[] {
  return steps.filter((step) => !step.optional);
}

export type OnboardingProgress = {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  /** First inspection the user can open on a phone (scheduled or in progress). */
  fieldInspectionId: string | null;
};

export async function getOnboardingProgress(
  session: DashboardSession,
): Promise<OnboardingProgress> {
  const scope = branchScopeFromSession(session);
  const customerWhere = customerWhereFromScope(scope, session.companyId);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);
  const inspectionWhere = inspectionWhereFromScope(scope, session.companyId);

  const [
    company,
    customerCount,
    buildingCount,
    equipmentCount,
    scheduledInspectionCount,
    fieldInspectionCount,
    fieldInspection,
    sampleBuilding,
  ] = await Promise.all([
    prisma.company.findFirst({
      where: { id: session.companyId },
      select: { logoUrl: true },
    }),
    prisma.customer.count({ where: customerWhere }),
    prisma.building.count({ where: buildingWhere }),
    prisma.buildingAsset.count({
      where: { active: true, building: buildingWhere },
    }),
    prisma.inspection.count({ where: inspectionWhere }),
    prisma.inspection.count({
      where: {
        ...inspectionWhere,
        status: { in: [InspectionStatus.in_progress, InspectionStatus.completed] },
      },
    }),
    prisma.inspection.findFirst({
      where: {
        ...inspectionWhere,
        status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      },
      orderBy: { scheduledAt: "asc" },
      select: { id: true },
    }),
    prisma.building.findFirst({
      where: buildingWhere,
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  const fieldInspectionId = fieldInspection?.id ?? null;
  const equipmentBuildingHref = sampleBuilding
    ? `/dashboard/buildings/${sampleBuilding.id}?tab=assets`
    : "/dashboard/buildings";

  const steps: OnboardingStep[] = [
    {
      id: "logo",
      title: "Add your company logo",
      description: "Shows on compliance PDFs you send to clients.",
      href: "/dashboard/settings",
      done: Boolean(company?.logoUrl?.trim()),
    },
    {
      id: "import-customers",
      title: "Import customers from CSV",
      description:
        "Property managers and facility owners — branch, name, optional email and phone. Best before bulk building import.",
      href: "/dashboard/customers/import",
      done: customerCount > 0 || buildingCount > 0,
    },
    {
      id: "customer",
      title: "Or add a single customer",
      description: "One account at a time from Customers → New customer.",
      href: "/dashboard/customers/new",
      done: customerCount > 0 || buildingCount > 0,
    },
    {
      id: "import-csv",
      title: "Import buildings from CSV",
      description:
        "Best for multi-site portfolios: download the template, one row per site (customer + address columns).",
      href: "/dashboard/buildings/import",
      done: buildingCount > 0,
    },
    {
      id: "building",
      title: "Or add a single building",
      description:
        "One site at a time from Buildings → Add building, or from the customer profile.",
      href: "/dashboard/buildings/new",
      done: buildingCount > 0,
    },
    {
      id: "equipment",
      title: "Import equipment (CSV) or add on a site",
      description:
        "Bulk register from Buildings → Import equipment, or open a building → Equipment tab for one-offs.",
      href: "/dashboard/buildings/import-equipment",
      done: equipmentCount > 0,
      optional: true,
    },
    {
      id: "schedule",
      title: "Schedule an inspection",
      description:
        "Pick a cadence or NFPA system pack — checklist items are created automatically.",
      href: "/dashboard/jobs/new",
      done: scheduledInspectionCount > 0,
    },
    {
      id: "field",
      title: "Run a field inspection on your phone",
      description: "Open the job on mobile, complete the checklist, and submit.",
      href: fieldInspectionId ? `/inspect/${fieldInspectionId}` : "/dashboard/jobs",
      done: fieldInspectionCount > 0,
    },
  ];

  const required = requiredOnboardingSteps(steps);
  const completedCount = required.filter((step) => step.done).length;

  return {
    steps,
    completedCount,
    totalCount: required.length,
    isComplete: completedCount === required.length,
    fieldInspectionId,
  };
}
