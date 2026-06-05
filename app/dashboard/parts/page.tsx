import Link from "next/link";
import { redirect } from "next/navigation";
import { PartsCatalog } from "@/components/parts/parts-catalog";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listCompanyParts } from "@/lib/parts/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function PartsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const parts = await listCompanyParts(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts inventory"
        description="Company-wide parts catalog and stock on hand. Work orders draw from this inventory when marked completed."
        actions={
          <Link
            href="/dashboard/work-orders"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            Work orders
          </Link>
        }
      />
      <PartsCatalog parts={parts} />
    </div>
  );
}
