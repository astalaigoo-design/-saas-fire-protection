"use client";

import Link from "next/link";
import { DownloadIcon, CalendarPlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dashboard/dates";
import type { BuildingInspectionRow } from "@/lib/buildings/queries";

type BuildingActionsProps = {
  buildingId: string;
  canSchedule: boolean;
  reportableInspections: BuildingInspectionRow[];
};

export function BuildingActions({
  buildingId,
  canSchedule,
  reportableInspections,
}: BuildingActionsProps) {
  const completed = reportableInspections.filter((i) => i.status === "completed");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {canSchedule ? (
        <Link
          href={`/dashboard/jobs/new?buildingId=${buildingId}`}
          className={cn(buttonVariants({ size: "lg" }), "min-h-11 gap-2 px-5")}
        >
          <CalendarPlusIcon className="size-4" aria-hidden />
          Schedule inspection
        </Link>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 gap-2 px-5",
          )}
          disabled={completed.length === 0}
        >
          <DownloadIcon className="size-4" aria-hidden />
          Generate report
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Completed inspections</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {completed.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No completed inspections to export yet.
            </p>
          ) : (
            completed.map((inspection) => (
              <DropdownMenuItem
                key={inspection.id}
                className="flex cursor-pointer flex-col items-start gap-0.5"
                onClick={() => {
                  window.open(`/api/inspections/${inspection.id}/report`, "_blank", "noopener");
                }}
              >
                <span className="font-medium">{inspection.inspectionType.name}</span>
                <span className="text-xs text-muted-foreground">
                  {inspection.completedAt
                    ? formatDate(inspection.completedAt)
                    : formatDate(inspection.scheduledAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
