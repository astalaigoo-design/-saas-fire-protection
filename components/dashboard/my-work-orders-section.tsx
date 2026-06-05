import Link from "next/link";
import { WorkOrdersList } from "@/components/work-orders/work-orders-list";
import type { WorkOrderListItem } from "@/lib/work-orders/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MyWorkOrdersSectionProps = {
  workOrders: WorkOrderListItem[];
};

export function MyWorkOrdersSection({ workOrders }: MyWorkOrdersSectionProps) {
  if (workOrders.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Assigned work orders ({workOrders.length})
        </h2>
        <p className="text-xs text-muted-foreground">Repair work — not inspection checklists</p>
      </div>
      <WorkOrdersList workOrders={workOrders} />
      <Link
        href="/dashboard/work-orders"
        className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto min-h-10 p-0")}
      >
        All work orders
      </Link>
    </section>
  );
}
