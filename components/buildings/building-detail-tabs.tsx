"use client";

import type { BuildingDetailPageData } from "@/lib/buildings/queries";
import { BuildingInspectionHistoryTab } from "@/components/buildings/building-inspection-history-tab";
import { BuildingPhotosTab } from "@/components/buildings/building-photos-tab";
import { BuildingReportsTab } from "@/components/buildings/building-reports-tab";
import { BuildingNotesTab } from "@/components/buildings/building-notes-tab";
import { BuildingAssetsTab } from "@/components/buildings/building-assets-tab";
import { BuildingDeficienciesTab } from "@/components/buildings/building-deficiencies-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BuildingDetailTabsProps = {
  data: BuildingDetailPageData;
  defaultTab?: "history" | "assets" | "deficiencies" | "photos" | "reports" | "notes";
};

export function BuildingDetailTabs({ data, defaultTab = "history" }: BuildingDetailTabsProps) {
  const photoCount = data.inspections.reduce((n, i) => n + i.photos.length, 0);

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <TabsList variant="line" className="min-w-max">
          <TabsTrigger value="history">Inspection history</TabsTrigger>
          <TabsTrigger value="assets">
            Equipment ({data.assets.length}
            {data.inactiveAssets.length > 0
              ? ` · ${data.inactiveAssets.length} removed`
              : ""}
            )
          </TabsTrigger>
          <TabsTrigger value="deficiencies">
            Deficiencies ({data.stats.openDeficiencyCount})
          </TabsTrigger>
          <TabsTrigger value="photos">Photos ({photoCount})</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="history" className="mt-4">
        <BuildingInspectionHistoryTab inspections={data.inspections} />
      </TabsContent>
      <TabsContent value="assets" className="mt-4">
        <BuildingAssetsTab
          buildingId={data.building.id}
          assets={data.assets}
          inactiveAssets={data.inactiveAssets}
          assetAuditHistory={data.assetAuditHistory}
          assetFormDefaults={data.assetFormDefaults}
        />
      </TabsContent>
      <TabsContent value="deficiencies" className="mt-4">
        <BuildingDeficienciesTab
          open={data.deficiencies.open}
          verified={data.deficiencies.verified}
          assignableStaff={data.assignableStaff}
        />
      </TabsContent>
      <TabsContent value="photos" className="mt-4">
        <BuildingPhotosTab inspections={data.inspections} />
      </TabsContent>
      <TabsContent value="reports" className="mt-4">
        <BuildingReportsTab inspections={data.inspections} />
      </TabsContent>
      <TabsContent value="notes" className="mt-4">
        <BuildingNotesTab building={data.building} />
      </TabsContent>
    </Tabs>
  );
}
