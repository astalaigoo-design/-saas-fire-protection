import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerSearchForm } from "@/components/customers/customer-search-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const customers = await listCustomers(session.companyId, filters);

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
          <Link
            href="/dashboard/customers/new"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
          >
            New customer
          </Link>
        }
      />

      <CustomerSearchForm params={filters} />
      <CustomerList customers={customers} />
    </div>
  );
}
