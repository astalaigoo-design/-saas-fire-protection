import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/dashboard/dates";
import type { DueAssetRow } from "@/lib/operations/due-assets";
import { cn } from "@/lib/utils";

function DueAssetStatusBadge({ status }: { status: DueAssetRow["status"] }) {
  const styles = {
    overdue: "bg-destructive/10 text-destructive",
    due_this_month: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  } as const;
  const labels = {
    overdue: "Overdue",
    due_this_month: "Due this month",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

type DueAssetListProps = {
  rows: DueAssetRow[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DueAssetList({
  rows,
  emptyTitle = "No equipment due",
  emptyDescription = "Set next service due dates on building equipment to track them here.",
}: DueAssetListProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {rows.map((row) => (
        <li key={row.assetId} className="px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/buildings/${row.buildingId}?tab=assets`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {row.buildingLabel}
                </Link>
                <DueAssetStatusBadge status={row.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {row.customerName} · {row.assetTypeLabel}
                {row.tagNumber ? ` · Tag ${row.tagNumber}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.location}
                {" · "}
                {row.status === "overdue"
                  ? `Was due ${formatDate(row.nextServiceDue)}`
                  : `Due ${formatDate(row.nextServiceDue)}`}
                {row.lastServiceAt
                  ? ` · Last serviced ${formatDate(row.lastServiceAt)}`
                  : ""}
              </p>
            </div>
            <Link
              href={`/dashboard/buildings/${row.buildingId}?tab=assets`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              View register
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
