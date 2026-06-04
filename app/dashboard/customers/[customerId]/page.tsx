import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerBranchForm } from "@/components/customers/customer-branch-form";
import { CustomerBuildingsSection } from "@/components/customers/customer-buildings-section";
import { CustomerInspectionHistory } from "@/components/customers/customer-inspection-history";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listBranchesForCompany } from "@/lib/branches/queries";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { canManageJobs } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/dashboard/dates";
import {
  getCustomerById,
  getCustomerInspectionHistory,
} from "@/lib/customers/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type CustomerDetailPageProps = {
  params: { customerId: string };
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const [customer, inspections, branches] = await Promise.all([
    getCustomerById(session, params.customerId),
    getCustomerInspectionHistory(session, params.customerId),
    canFilterBranchesByCookie(session)
      ? listBranchesForCompany(session.companyId)
      : Promise.resolve([]),
  ]);

  if (!customer) notFound();

  const canMoveBranch = canFilterBranchesByCookie(session) && branches.length > 1;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          href="/dashboard/customers"
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "h-auto min-h-11 justify-start p-0",
          )}
        >
          ← All customers
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {customer.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {customer.email ? <span>{customer.email}</span> : null}
              {customer.phone ? <span>{customer.phone}</span> : null}
              <span>
                Added {formatDate(customer.createdAt)}
              </span>
              {!canMoveBranch && customer.branch?.name ? (
                <span>Branch · {customer.branch.name}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {canMoveBranch ? (
              <div className="flex w-full flex-col gap-1 sm:w-auto sm:items-end">
                <p className="text-xs font-medium text-muted-foreground">Branch</p>
                <CustomerBranchForm
                  customerId={customer.id}
                  branchId={customer.branchId}
                  branches={branches}
                />
              </div>
            ) : null}
            <Link
              href={`/dashboard/buildings/new?customerId=${customer.id}`}
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
            >
              Add building
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="buildings-heading">
        <h2 id="buildings-heading" className="mb-4 font-heading text-lg font-semibold text-foreground">
          Buildings ({customer.buildings.length})
        </h2>
        <CustomerBuildingsSection
          buildings={customer.buildings}
          canSchedule={canManageJobs(session.role)}
        />
      </section>

      <section aria-labelledby="inspections-heading">
        <h2 id="inspections-heading" className="mb-4 font-heading text-lg font-semibold text-foreground">
          Inspection history
        </h2>
        <CustomerInspectionHistory inspections={inspections} />
      </section>
    </div>
  );
}
