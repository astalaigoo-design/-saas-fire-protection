import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { InspectionJobEditForm } from "@/components/scheduling/inspection-job-edit-form";
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assign & reschedule"
        description="Update who performs this visit and when. The assigned technician receives email and an in-app alert."
      />
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
