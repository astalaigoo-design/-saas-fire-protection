import Link from "next/link";
import { workOrderStatusLabel } from "@/lib/work-orders/constants";
import type { WorkOrderListItem } from "@/lib/work-orders/queries";
import { formatDate } from "@/lib/dashboard/dates";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkOrdersListProps = {
  workOrders: WorkOrderListItem[];
};

export function WorkOrdersList({ workOrders }: WorkOrdersListProps) {
  if (workOrders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No work orders yet. Create one for repairs or parts replacement without scheduling an
        inspection visit.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {workOrders.map((row) => (
        <li key={row.id}>
          <Link href={`/dashboard/work-orders/${row.id}`} className="block rounded-xl transition-opacity hover:opacity-95">
            <Card>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{row.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.buildingLabel} · {row.building.customer.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.scheduledAt ? `Scheduled ${formatDate(row.scheduledAt)}` : "Not scheduled"}
                    {row.assignedTo?.name ? ` · ${row.assignedTo.name}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    row.status === "completed" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                    row.status === "cancelled" && "bg-muted text-muted-foreground",
                    (row.status === "draft" || row.status === "scheduled") &&
                      "bg-sky-500/15 text-sky-900 dark:text-sky-100",
                    row.status === "in_progress" && "bg-amber-500/15 text-amber-900 dark:text-amber-100",
                  )}
                >
                  {workOrderStatusLabel(row.status)}
                </span>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
