import { notFound, redirect } from "next/navigation";
import { WorkOrderDetailPanel } from "@/components/work-orders/work-order-detail-panel";
import { canManageJobs } from "@/lib/auth/permissions";
import { listAssignableStaff } from "@/lib/deficiencies/queries";
import { listCompanyParts } from "@/lib/parts/queries";
import { getWorkOrderForSession } from "@/lib/work-orders/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type WorkOrderDetailPageProps = {
  params: { workOrderId: string };
};

export default async function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const canEdit = canManageJobs(session.role);
  const workOrder = await getWorkOrderForSession(session, params.workOrderId);
  if (!workOrder) notFound();

  const [technicians, parts] = await Promise.all([
    canEdit ? listAssignableStaff(session) : Promise.resolve([]),
    canEdit ? listCompanyParts(session) : Promise.resolve([]),
  ]);

  return (
    <WorkOrderDetailPanel
      workOrder={workOrder}
      technicians={technicians}
      parts={parts}
      canEdit={canEdit}
    />
  );
}
