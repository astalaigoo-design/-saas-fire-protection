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
};

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
    scheduledInspectionCount,
    fieldInspectionCount,
    fieldInspection,
  ] = await Promise.all([
    prisma.company.findFirst({
      where: { id: session.companyId },
      select: { logoUrl: true },
    }),
    prisma.customer.count({ where: customerWhere }),
    prisma.building.count({ where: buildingWhere }),
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
  ]);

  const fieldInspectionId = fieldInspection?.id ?? null;

  const steps: OnboardingStep[] = [
    {
      id: "logo",
      title: "Add your company logo",
      description: "Shows on compliance PDFs you send to clients.",
      href: "/dashboard/settings",
      done: Boolean(company?.logoUrl?.trim()),
    },
    {
      id: "customer",
      title: "Add your first customer",
      description: "The property owner or facility you inspect for.",
      href: "/dashboard/customers/new",
      done: customerCount > 0,
    },
    {
      id: "building",
      title: "Add a building or site",
      description: "Each customer can have one or more locations.",
      href: "/dashboard/buildings/new",
      done: buildingCount > 0,
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

  const completedCount = steps.filter((step) => step.done).length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    isComplete: completedCount === steps.length,
    fieldInspectionId,
  };
}
