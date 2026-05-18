import { formatDate, formatDateTime } from "@/lib/dashboard/dates";
import type { BuildingDetailPageData } from "@/lib/buildings/queries";
import { ComplianceBadge } from "@/components/buildings/compliance-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BuildingStatusCardsProps = {
  stats: BuildingDetailPageData["stats"];
};

export function BuildingStatusCards({ stats }: BuildingStatusCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Compliance status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComplianceBadge level={stats.compliance} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Next inspection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {stats.nextScheduledAt ? formatDateTime(stats.nextScheduledAt) : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {stats.lastCompletedAt ? formatDate(stats.lastCompletedAt) : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Inspections completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {stats.completedCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
