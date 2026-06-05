import Link from "next/link";
import { AssetType } from "@prisma/client";
import { waterSystemAssetTypeLabel } from "@/lib/assets/constants";
import {
  systemTestStatusLabel,
  type SystemTestStatusByType,
} from "@/lib/assets/system-test-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WATER_SYSTEM_TYPES = [
  AssetType.fire_hydrant,
  AssetType.standpipe,
  AssetType.sprinkler_component,
] as const;

type SystemTestStatusCardsProps = {
  buildingId: string;
  statusByType: SystemTestStatusByType;
};

function statusStyles(status: SystemTestStatusByType[typeof WATER_SYSTEM_TYPES[number]]) {
  switch (status) {
    case "overdue":
      return "text-destructive";
    case "due_soon":
      return "text-amber-800 dark:text-amber-200";
    case "missing_due_date":
      return "text-sky-800 dark:text-sky-200";
    case "not_registered":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

export function SystemTestStatusCards({
  buildingId,
  statusByType,
}: SystemTestStatusCardsProps) {
  return (
    <section aria-labelledby="system-test-status-heading" className="space-y-3">
      <div>
        <h2
          id="system-test-status-heading"
          className="font-heading text-base font-semibold text-foreground"
        >
          Water system test schedules
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-asset due dates from the equipment register. Five-year standpipe flow tests are
          tracked separately from annual inspection cadence.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {WATER_SYSTEM_TYPES.map((assetType) => {
          const status = statusByType[assetType];
          return (
            <Card key={assetType}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {waterSystemAssetTypeLabel(assetType)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={cn("text-lg font-semibold", statusStyles(status))}>
                  {systemTestStatusLabel(status)}
                </p>
                {status !== "not_registered" ? (
                  <Link
                    href={`/dashboard/buildings/${buildingId}?tab=assets&assetType=${assetType}`}
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    View register
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/buildings/${buildingId}?tab=assets`}
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Add equipment
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
