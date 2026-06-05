import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkOrdersList } from "@/components/work-orders/work-orders-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listCompanyWorkOrders } from "@/lib/work-orders/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function WorkOrdersPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  if (session.role === "technician") redirect("/dashboard/my-jobs");
  ensureCanManageJobs(session.role);

  const workOrders = await listCompanyWorkOrders(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work orders"
        description="Repair and parts work separate from NFPA inspection visits. Optionally link to a deficiency or quote."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/parts"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
            >
              Parts inventory
            </Link>
            <Link
              href="/dashboard/work-orders/new"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
            >
              New work order
            </Link>
          </div>
        }
      />
      <WorkOrdersList workOrders={workOrders} />
    </div>
  );
}
