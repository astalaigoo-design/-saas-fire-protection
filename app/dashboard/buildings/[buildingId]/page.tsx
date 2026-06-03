import { notFound, redirect } from "next/navigation";
import { BuildingActions } from "@/components/buildings/building-actions";
import { BuildingDetailTabs } from "@/components/buildings/building-detail-tabs";
import { BuildingHeader } from "@/components/buildings/building-header";
import { BuildingStatusCards } from "@/components/buildings/building-status-cards";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { canManageJobs } from "@/lib/auth/permissions";
import { getBuildingDetailPageData } from "@/lib/buildings/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type BuildingDetailPageProps = {
  params: { buildingId: string };
};

export default async function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const data = await getBuildingDetailPageData(session, params.buildingId);
  if (!data) notFound();

  return (
    <div className="space-y-8">
      <BuildingHeader data={data} canEdit />
      <BuildingStatusCards stats={data.stats} />
      <BuildingActions
        buildingId={data.building.id}
        canSchedule={canManageJobs(session.role)}
        reportableInspections={data.inspections}
      />
      <BuildingDetailTabs data={data} />
    </div>
  );
}
