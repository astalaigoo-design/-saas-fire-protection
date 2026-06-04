import { notFound, redirect } from "next/navigation";
import { BuildingActions } from "@/components/buildings/building-actions";
import { BuildingDetailTabs } from "@/components/buildings/building-detail-tabs";
import { BuildingHeader } from "@/components/buildings/building-header";
import { BuildingStatusCards } from "@/components/buildings/building-status-cards";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { canManageJobs } from "@/lib/auth/permissions";
import { getBuildingDetailPageData } from "@/lib/buildings/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

const BUILDING_TAB_VALUES = [
  "history",
  "assets",
  "deficiencies",
  "photos",
  "reports",
  "notes",
] as const;

type BuildingTabValue = (typeof BUILDING_TAB_VALUES)[number];

function resolveBuildingTab(tab: string | undefined): BuildingTabValue {
  if (tab && BUILDING_TAB_VALUES.includes(tab as BuildingTabValue)) {
    return tab as BuildingTabValue;
  }
  return "history";
}

type BuildingDetailPageProps = {
  params: { buildingId: string };
  searchParams?: { tab?: string };
};

export default async function BuildingDetailPage({
  params,
  searchParams,
}: BuildingDetailPageProps) {
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
      <BuildingDetailTabs data={data} defaultTab={resolveBuildingTab(searchParams?.tab)} />
    </div>
  );
}
