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

const statusStyles: Record<string, "secondary" | "outline" | "destructive"> = {
  scheduled: "secondary",
  in_progress: "outline",
};

export function UpcomingInspectionCard({ inspection }: UpcomingInspectionCardProps) {
  const statusVariant = statusStyles[inspection.status] ?? "outline";

  return (
    <Card className="min-h-[9rem] bg-slate-900/70 text-white ring-slate-800">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={statusVariant}
            className="capitalize bg-slate-800/90 text-slate-200"
          >
          {inspection.status.replace("_", " ")}
          </Badge>
          <span className="text-xs text-slate-500">{inspection.inspectionType.name}</span>
        </div>
        <h3 className="mt-3 font-medium leading-snug text-white">
          {buildingLabel(inspection)}
        </h3>
        <p className="mt-1 text-sm text-slate-400">{inspection.building.customer.name}</p>
        <p className="mt-3 text-sm text-amber-400/90">
          {formatDateTime(inspection.scheduledAt)}
        </p>
        {inspection.assignedTo?.name ? (
          <p className="mt-auto pt-3 text-xs text-slate-500">
            Assigned: {inspection.assignedTo.name}
          </p>
        ) : (
          <p className="mt-auto pt-3 text-xs text-slate-600">Unassigned</p>
        )}
        <Link
          href={`/inspect/${inspection.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "default" }),
            "mt-3 h-11 justify-start px-0 text-amber-400 hover:bg-transparent hover:text-amber-300",
          )}
        >
          Open inspection
        </Link>
      </CardContent>
    </Card>
  );
}



