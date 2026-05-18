"use client";

import type { BuildingDetailPageData } from "@/lib/buildings/queries";
import { BuildingInspectionHistoryTab } from "@/components/buildings/building-inspection-history-tab";
import { BuildingPhotosTab } from "@/components/buildings/building-photos-tab";
import { BuildingReportsTab } from "@/components/buildings/building-reports-tab";
import { BuildingNotesTab } from "@/components/buildings/building-notes-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BuildingDetailTabsProps = {
  data: BuildingDetailPageData;
};

export function BuildingDetailTabs({ data }: BuildingDetailTabsProps) {
  const photoCount = data.inspections.reduce((n, i) => n + i.photos.length, 0);

  return (
    <Tabs defaultValue="history" className="w-full">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <TabsList variant="line" className="min-w-max">
          <TabsTrigger value="history">Inspection history</TabsTrigger>
          <TabsTrigger value="photos">Photos ({photoCount})</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="history" className="mt-4">
        <BuildingInspectionHistoryTab inspections={data.inspections} />
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
