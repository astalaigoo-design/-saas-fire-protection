import Link from "next/link";
import { WorkOrdersList } from "@/components/work-orders/work-orders-list";
import type { WorkOrderListItem } from "@/lib/work-orders/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommandCenterWorkOrdersSectionProps = {
  workOrders: WorkOrderListItem[];
  openCount: number;
};

export function CommandCenterWorkOrdersSection({
  workOrders,
  openCount,
}: CommandCenterWorkOrdersSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Work orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Repair and parts work separate from NFPA inspection visits. {openCount} open across
            your scope.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/parts"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
          >
            Parts inventory
          </Link>
          <Link href="/dashboard/work-orders/new" className={cn(buttonVariants(), "min-h-10")}>
            New work order
          </Link>
        </div>
      </div>
      <WorkOrdersList workOrders={workOrders.slice(0, 8)} />
      {openCount > workOrders.length ? (
        <Link href="/dashboard/work-orders" className="text-sm font-medium text-primary hover:underline">
          View all work orders
        </Link>
      ) : null}
    </section>
  );
}
