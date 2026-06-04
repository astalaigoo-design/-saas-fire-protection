import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerSearchForm } from "@/components/customers/customer-search-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listBranchesForCompany } from "@/lib/branches/queries";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { listCustomers } from "@/lib/customers/queries";
import { parseCustomerSearchParams } from "@/lib/customers/schemas";
import { getDashboardSession } from "@/lib/dashboard/session";

type CustomersPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const filters = parseCustomerSearchParams(searchParams);
  const canReassignBranch = canFilterBranchesByCookie(session);
  const [customers, branches] = await Promise.all([
    listCustomers(session, filters),
    canReassignBranch
      ? listBranchesForCompany(session.companyId)
      : Promise.resolve([]),
  ]);

  const description = [
    `${customers.length} ${customers.length === 1 ? "customer" : "customers"}`,
    filters.q ? `matching “${filters.q}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customers"
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/customers/import"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
            >
              Import CSV
            </Link>
            <Link
              href="/dashboard/buildings/import"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
            >
              Import buildings
            </Link>
            <Link
              href="/dashboard/customers/new"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
            >
              New customer
            </Link>
          </div>
        }
      />

      <CustomerSearchForm params={filters} />
      <CustomerList
        customers={customers}
        branches={branches}
        canReassignBranch={canReassignBranch}
      />
    </div>
  );
}
