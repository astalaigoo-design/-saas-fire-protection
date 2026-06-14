import { notFound, redirect } from "next/navigation";
import { TechnicianWorkOrderPanel } from "@/components/work-orders/technician-work-order-panel";
import { WorkOrderDetailPanel } from "@/components/work-orders/work-order-detail-panel";
import { canManageJobs } from "@/lib/auth/permissions";
import { listAssignableStaff } from "@/lib/deficiencies/queries";
import { listCompanyPartsForPage } from "@/lib/parts/serialize";
import { getWorkOrderForSession } from "@/lib/work-orders/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type WorkOrderDetailPageProps = {
  params: { workOrderId: string };
};

export default async function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const isTechnician = session.role === "technician";
  const canEdit = canManageJobs(session.role);
  const workOrder = await getWorkOrderForSession(session, params.workOrderId);
  if (!workOrder) notFound();

  const partsResult = await listCompanyPartsForPage(session);
  const parts = partsResult.ok ? partsResult.parts : [];

  if (isTechnician) {
    return <TechnicianWorkOrderPanel workOrder={workOrder} parts={parts} />;
  }

  const technicians = await listAssignableStaff(session);

  return (
    <WorkOrderDetailPanel
      workOrder={workOrder}
      technicians={technicians}
      parts={parts}
      canEdit={canEdit}
    />
  );
}
