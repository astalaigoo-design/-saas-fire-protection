import Link from "next/link";
import { CalendarPlusIcon } from "lucide-react";
import { buildingAddressLine, buildingLabel } from "@/lib/customers/format";
import type { CustomerBuildingCard } from "@/lib/customers/queries";
import { formatDateTime } from "@/lib/dashboard/dates";
import { ComplianceBadge } from "@/components/buildings/compliance-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type CustomerBuildingsSectionProps = {
  buildings: CustomerBuildingCard[];
  canSchedule: boolean;
};

export function CustomerBuildingsSection({
  buildings,
  canSchedule,
}: CustomerBuildingsSectionProps) {
  if (buildings.length === 0) {
    return (
      <EmptyState
        title="No buildings on file"
        description="Add a site when creating or editing this customer."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {buildings.map((building) => (
        <li key={building.id}>
          <Card className="relative overflow-hidden transition-colors hover:bg-muted/30">
            <Link
              href={`/dashboard/buildings/${building.id}`}
              className="absolute inset-0 z-0 rounded-xl"
              aria-label={`View ${buildingLabel(building)}`}
            />
            <CardContent className="relative z-10 space-y-4 pointer-events-none">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{buildingLabel(building)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {buildingAddressLine(building)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {building.city}, {building.region} {building.postalCode}
                  </p>
                </div>
                <ComplianceBadge level={building.stats.compliance} className="shrink-0" />
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Next inspection due</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {building.stats.nextScheduledAt
                      ? formatDateTime(building.stats.nextScheduledAt)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Inspections completed</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {building.stats.completedCount}
                  </dd>
                </div>
              </dl>

              {canSchedule ? (
                <div className="pointer-events-auto pt-1">
                  <Link
                    href={`/dashboard/jobs/new?buildingId=${building.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "min-h-11 w-full gap-2 sm:w-auto",
                    )}
                  >
                    <CalendarPlusIcon className="size-4" aria-hidden />
                    Schedule inspection
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
