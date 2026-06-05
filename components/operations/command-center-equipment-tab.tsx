import { AssetType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DueAssetList } from "@/components/operations/due-asset-list";
import { waterSystemAssetTypeLabel } from "@/lib/assets/constants";
import {
  filterDueWaterSystemAssets,
  groupDueAssetsByType,
} from "@/lib/operations/due-assets";
import type { CommandCenterSnapshot } from "@/lib/operations/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommandCenterEquipmentTabProps = {
  dueAssets: CommandCenterSnapshot["dueAssets"];
  importHealth: CommandCenterSnapshot["importHealth"];
};

function DueReportStat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CommandCenterEquipmentTab({
  dueAssets,
  importHealth,
}: CommandCenterEquipmentTabProps) {
  const { totals, waterSystems } = dueAssets;
  const attentionTotal = totals.equipmentOverdue + totals.equipmentDueThisMonth;
  const waterSystemRows = filterDueWaterSystemAssets(dueAssets.rows);
  const waterSystemByType = groupDueAssetsByType(waterSystemRows);
  const nonWaterRows = dueAssets.rows.filter(
    (row) =>
      row.assetType !== AssetType.fire_hydrant &&
      row.assetType !== AssetType.standpipe &&
      row.assetType !== AssetType.sprinkler_component,
  );
  const nonWaterByType = groupDueAssetsByType(nonWaterRows);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Asset due report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Overdue register items and anything due in {dueAssets.serviceMonthLabel}. Hydrant,
            standpipe, and sprinkler tests use per-type branch intervals; passing a field test
            advances the next due date.
          </p>
        </div>
        <a
          href="/api/operations/export?type=equipment-due"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-10 shrink-0")}
        >
          Export due report (CSV)
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DueReportStat
          label="Overdue now"
          value={totals.equipmentOverdue}
          hint="Past next service due"
        />
        <DueReportStat
          label={`Due ${dueAssets.serviceMonthLabel}`}
          value={totals.equipmentDueThisMonth}
          hint="Due before month end"
        />
        <DueReportStat
          label="Extinguishers due"
          value={totals.extinguishersDueThisMonth}
          hint="Overdue + due this month"
        />
        <DueReportStat
          label="Water system tests"
          value={waterSystems.attentionTotal}
          hint="Hydrant, standpipe, sprinkler"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            AssetType.fire_hydrant,
            AssetType.standpipe,
            AssetType.sprinkler_component,
          ] as const
        ).map((assetType) => {
          const typeTotals = waterSystems[assetType];
          const attention = typeTotals.overdue + typeTotals.dueThisMonth;
          return (
            <div key={assetType} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {waterSystemAssetTypeLabel(assetType)}
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold text-foreground">
                {attention}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {typeTotals.overdue} overdue · {typeTotals.dueThisMonth} due{" "}
                {dueAssets.serviceMonthLabel}
              </p>
            </div>
          );
        })}
      </div>

      {importHealth.assetsMissingNextDue > 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {importHealth.assetsMissingNextDue} active asset
          {importHealth.assetsMissingNextDue === 1 ? "" : "s"} have no next service due date — they
          will not appear in this report until dates are set on the Equipment tab or import.
        </p>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base">
            Full due report ({attentionTotal})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <DueAssetList
            rows={dueAssets.rows}
            emptyTitle="No equipment due"
            emptyDescription="Import equipment or set next service due dates on building registers."
          />
        </CardContent>
      </Card>

      {waterSystemRows.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">
              Water system tests ({waterSystemRows.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {waterSystemByType.map((group) => (
              <div key={group.assetType} className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  {group.assetTypeLabel} ({group.rows.length})
                </h3>
                <DueAssetList rows={group.rows} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {nonWaterByType.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {nonWaterByType.map((group) => (
            <Card key={group.assetType}>
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">
                  {group.assetTypeLabel} ({group.rows.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <DueAssetList rows={group.rows} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
