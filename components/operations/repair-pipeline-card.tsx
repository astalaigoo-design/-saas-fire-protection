import Link from "next/link";
import { RepairPipelineSteps } from "@/components/operations/repair-pipeline-steps";
import { buttonVariants } from "@/components/ui/button";
import type { RepairPipelineRow } from "@/lib/operations/repair-pipeline";
import { formatDate } from "@/lib/dashboard/dates";
import { cn } from "@/lib/utils";

type RepairPipelineCardProps = {
  row: RepairPipelineRow;
};

export function RepairPipelineCard({ row }: RepairPipelineCardProps) {
  return (
    <article className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-foreground">{row.label}</h3>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                row.isClosed
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                  : "bg-primary/10 text-primary",
              )}
            >
              {row.pipelineStageLabel}
            </span>
          </div>
          {row.description ? (
            <p className="text-xs leading-5 text-muted-foreground">{row.description}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/dashboard/buildings/${row.buildingId}`}
              className="text-primary hover:underline"
            >
              {row.buildingLabel}
            </Link>
            {" · "}
            {row.customerName} · {row.inspectionTypeName}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.sourceCompletedAt
              ? `Found ${formatDate(row.sourceCompletedAt)}`
              : "From inspection"}
            {row.verifiedAt ? ` · Verified ${formatDate(row.verifiedAt)}` : ""}
          </p>
        </div>
      </div>

      <RepairPipelineSteps row={row} />

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Link
          href={`/dashboard/buildings/${row.buildingId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
        >
          Building
        </Link>
        <Link
          href={
            row.quoteId
              ? `/dashboard/quotes?stage=${
                  row.quoteStatus === "sent"
                    ? "awaiting"
                    : row.quoteStatus === "accepted"
                      ? "accepted"
                      : row.quoteStatus === "declined"
                        ? "declined"
                        : "draft"
                }`
              : "/dashboard/quotes"
          }
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
        >
          {row.quoteId ? "Review quote" : "Quotes"}
        </Link>
        {row.activeWorkOrder ? (
          <Link
            href={`/dashboard/work-orders/${row.activeWorkOrder.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
          >
            Open work order
          </Link>
        ) : (
          <Link
            href={`/dashboard/work-orders/new?buildingId=${row.buildingId}&deficiencyId=${row.deficiencyId}${row.quoteId ? `&quoteId=${row.quoteId}` : ""}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
          >
            Create work order
          </Link>
        )}
        {row.scheduledInspectionId ? (
          <Link
            href={`/inspect/${row.scheduledInspectionId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
          >
            Follow-up job
          </Link>
        ) : null}
        {row.linkedAsset ? (
          <Link
            href={`/dashboard/buildings/${row.buildingId}?tab=assets`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-9")}
          >
            Equipment register
          </Link>
        ) : null}
        <Link
          href={`/inspect/${row.sourceInspectionId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-9")}
        >
          Source inspection
        </Link>
      </div>
    </article>
  );
}
