import Link from "next/link";
import type { InspectionListItem } from "@/lib/dashboard/queries";
import { formatDateTime } from "@/lib/dashboard/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpcomingInspectionCardProps = {
  inspection: InspectionListItem;
};

function buildingLabel(inspection: InspectionListItem): string {
  return (
    inspection.building.name ??
    `${inspection.building.addressLine1}, ${inspection.building.city}`
  );
}

const statusVariant: Record<string, "secondary" | "outline"> = {
  scheduled: "secondary",
  in_progress: "outline",
};

export function UpcomingInspectionCard({ inspection }: UpcomingInspectionCardProps) {
  const variant = statusVariant[inspection.status] ?? "outline";

  return (
    <Card className="min-h-[9rem]">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={variant} className="capitalize">
            {inspection.status.replace("_", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">{inspection.inspectionType.name}</span>
        </div>
        <h3 className="mt-3 font-medium leading-snug text-foreground">
          {buildingLabel(inspection)}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {inspection.building.customer.name}
        </p>
        <p className="mt-3 text-sm font-medium text-primary">
          {formatDateTime(inspection.scheduledAt)}
        </p>
        {inspection.assignedTo?.name ? (
          <p className="mt-auto pt-3 text-xs text-muted-foreground">
            Assigned: {inspection.assignedTo.name}
          </p>
        ) : (
          <p className="mt-auto pt-3 text-xs text-muted-foreground/80">Unassigned</p>
        )}
        <Link
          href={`/inspect/${inspection.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "default" }),
            "mt-3 h-11 justify-start px-0 text-primary hover:bg-transparent hover:text-primary/90",
          )}
        >
          Open inspection
        </Link>
      </CardContent>
    </Card>
  );
}
