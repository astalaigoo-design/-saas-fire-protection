import Link from "next/link";
import { redirect } from "next/navigation";
import { AssetImportForm } from "@/components/buildings/asset-import-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { listBranchesForCompany } from "@/lib/branches/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function BuildingEquipmentImportPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const branches = await listBranchesForCompany(session.companyId);
  const branchHint =
    branches.length > 1
      ? branches.map((b) => b.name).join(", ")
      : branches[0]?.name ?? "Main";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import equipment"
        description="Bulk-load the equipment register for sites already in FlareFlow."
        actions={
          <Link
            href="/dashboard/buildings"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
          >
            All buildings
          </Link>
        }
      />
      <AssetImportForm branchHint={branchHint} />
    </div>
  );
}
