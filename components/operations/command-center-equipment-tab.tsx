import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DueAssetList } from "@/components/operations/due-asset-list";
import type { CommandCenterSnapshot } from "@/lib/operations/queries";

type CommandCenterEquipmentTabProps = {
  dueAssets: CommandCenterSnapshot["dueAssets"];
  importHealth: CommandCenterSnapshot["importHealth"];
};

export function CommandCenterEquipmentTab({
  dueAssets,
  importHealth,
}: CommandCenterEquipmentTabProps) {
  const overdueRows = dueAssets.rows.filter((row) => row.status === "overdue");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Equipment service due dates
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overdue register items and anything due in {dueAssets.serviceMonthLabel}. Pass on field
          inspections updates last service; due dates come from the building register or equipment
          CSV.
        </p>
      </div>

      {importHealth.assetsMissingNextDue > 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {importHealth.assetsMissingNextDue} active asset
          {importHealth.assetsMissingNextDue === 1 ? "" : "s"} have no next service due date — they
          will not appear here until dates are set on the Equipment tab or import.
        </p>
      ) : null}

      {overdueRows.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Overdue now ({overdueRows.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DueAssetList rows={overdueRows} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">
              Fire extinguishers ({dueAssets.serviceMonthLabel})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DueAssetList
              rows={dueAssets.extinguishers}
              emptyTitle="No extinguishers due"
              emptyDescription="Import equipment or add extinguishers with a next service due date."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">All equipment types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {dueAssets.byType.length === 0 ? (
              <DueAssetList rows={[]} />
            ) : (
              dueAssets.byType.map((group) => (
                <div key={group.assetType} className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    {group.assetTypeLabel} ({group.rows.length})
                  </h3>
                  <DueAssetList rows={group.rows} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
