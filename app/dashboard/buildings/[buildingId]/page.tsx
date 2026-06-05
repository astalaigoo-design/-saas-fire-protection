import { notFound, redirect } from "next/navigation";
import { BuildingActions } from "@/components/buildings/building-actions";
import { BuildingDetailTabs } from "@/components/buildings/building-detail-tabs";
import { BuildingHeader } from "@/components/buildings/building-header";
import { BuildingStatusCards } from "@/components/buildings/building-status-cards";
import { SystemTestStatusCards } from "@/components/buildings/system-test-status-cards";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { canManageJobs } from "@/lib/auth/permissions";
import { AssetType } from "@prisma/client";
import { getBuildingDetailPageData } from "@/lib/buildings/queries";
import { resolveBuildingTab } from "@/lib/buildings/detail-tabs";
import { getDashboardSession } from "@/lib/dashboard/session";

const ASSET_TYPE_FILTER_VALUES = [
  AssetType.fire_hydrant,
  AssetType.standpipe,
  AssetType.sprinkler_component,
] as const;

type BuildingDetailPageProps = {
  params: { buildingId: string };
  searchParams?: { tab?: string; assetType?: string };
};

function resolveAssetTypeFilter(value: string | undefined): AssetType | undefined {
  if (!value) return undefined;
  return ASSET_TYPE_FILTER_VALUES.includes(value as (typeof ASSET_TYPE_FILTER_VALUES)[number])
    ? (value as AssetType)
    : undefined;
}

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
      <SystemTestStatusCards
        buildingId={data.building.id}
        statusByType={data.systemTestStatus}
      />
      <BuildingActions
        buildingId={data.building.id}
        canSchedule={canManageJobs(session.role)}
        reportableInspections={data.inspections}
      />
      <BuildingDetailTabs
        data={data}
        defaultTab={resolveBuildingTab(searchParams?.tab)}
        assetTypeFilter={resolveAssetTypeFilter(searchParams?.assetType)}
      />
    </div>
  );
}
