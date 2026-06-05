import Link from "next/link";
import { WorkOrderStatus } from "@prisma/client";
import { workOrderStatusLabel } from "@/lib/work-orders/constants";
import type { WorkOrderListItem } from "@/lib/work-orders/queries";
import { formatDate } from "@/lib/dashboard/dates";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MyWorkOrdersSectionProps = {
  workOrders: WorkOrderListItem[];
};

const statusOrder: Record<WorkOrderStatus, number> = {
  [WorkOrderStatus.in_progress]: 0,
  [WorkOrderStatus.scheduled]: 1,
  [WorkOrderStatus.draft]: 2,
  [WorkOrderStatus.completed]: 3,
  [WorkOrderStatus.cancelled]: 4,
};

function sortWorkOrders(rows: WorkOrderListItem[]): WorkOrderListItem[] {
  return [...rows].sort((a, b) => {
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus !== 0) return byStatus;
    const aTime = a.scheduledAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.scheduledAt?.getTime() ?? b.createdAt.getTime();
    return aTime - bTime;
  });
}

export function MyWorkOrdersSection({ workOrders }: MyWorkOrdersSectionProps) {
  if (workOrders.length === 0) return null;

  const sorted = sortWorkOrders(workOrders);
  const inProgress = sorted.filter((row) => row.status === WorkOrderStatus.in_progress);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Assigned work orders ({workOrders.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Repair work — start on site, log notes and parts, then mark complete (not inspection
          checklists).
        </p>
      </div>

      {inProgress.length > 0 ? (
        <p className="text-sm text-amber-900 dark:text-amber-100">
          {inProgress.length} in progress — tap to continue and mark complete.
        </p>
      ) : null}

      <ul className="space-y-3">
        {sorted.map((row) => (
          <li key={row.id}>
            <Link
              href={`/dashboard/work-orders/${row.id}`}
              className="block rounded-xl transition-opacity hover:opacity-95"
            >
              <Card
                className={cn(
                  row.status === WorkOrderStatus.in_progress && "border-primary/40 bg-primary/5",
                )}
              >
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {row.buildingLabel} · {row.building.customer.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.scheduledAt
                        ? `Scheduled ${formatDate(row.scheduledAt)}`
                        : "Not scheduled"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-h-8 shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium",
                      row.status === WorkOrderStatus.in_progress &&
                        "bg-amber-500/15 text-amber-900 dark:text-amber-100",
                      (row.status === WorkOrderStatus.draft ||
                        row.status === WorkOrderStatus.scheduled) &&
                        "bg-sky-500/15 text-sky-900 dark:text-sky-100",
                    )}
                  >
                    {row.status === WorkOrderStatus.in_progress
                      ? "Continue"
                      : workOrderStatusLabel(row.status)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
