import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { JobEquipmentSection } from "@/components/dashboard/job-equipment-section";
import { InspectionJobEditForm } from "@/components/scheduling/inspection-job-edit-form";
import { JobAssignmentScopeNotice } from "@/components/scheduling/job-assignment-scope-notice";
import { listBuildingEquipmentPreview } from "@/lib/inspect/job-equipment";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getScheduleFormData } from "@/lib/scheduling/queries";
import { prisma } from "@/lib/prisma";

type JobEditPageProps = {
  params: { inspectionId: string };
};

export default async function JobEditPage({ params }: JobEditPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const scope = branchScopeFromSession(session);
  const [inspection, formData] = await Promise.all([
    prisma.inspection.findFirst({
      where: {
        id: params.inspectionId,
        ...inspectionWhereFromScope(scope, session.companyId),
      },
      select: {
        id: true,
        buildingId: true,
        scheduledAt: true,
        assignedToUserId: true,
        status: true,
        inspectionType: { select: { name: true } },
        building: {
          select: {
            name: true,
            addressLine1: true,
            city: true,
          },
        },
      },
    }),
    getScheduleFormData(session),
  ]);

  if (!inspection) notFound();

  if (inspection.status === "completed" || inspection.status === "cancelled") {
    return (
      <div className="space-y-4">
        <PageHeader title="Job" description="This visit can no longer be rescheduled here." />
        <Link href={`/inspect/${inspection.id}`} className={cn(buttonVariants(), "min-h-10")}>
          View inspection
        </Link>
      </div>
    );
  }

  const label = buildingLabel(inspection.building);
  const equipment = await listBuildingEquipmentPreview(inspection.buildingId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assign & reschedule"
        description="Update who performs this visit and when. One assigned technician receives email and in-app alerts — no multi-tech crews on a single job."
      />
      <JobAssignmentScopeNotice variant="inline" />
      <JobEquipmentSection buildingId={inspection.buildingId} rows={equipment} />
      <InspectionJobEditForm
        inspectionId={inspection.id}
        scheduledAt={inspection.scheduledAt}
        assignedToUserId={inspection.assignedToUserId}
        buildingLabel={label}
        inspectionTypeName={inspection.inspectionType.name}
        status={inspection.status}
        formData={formData}
      />
    </div>
  );
}
