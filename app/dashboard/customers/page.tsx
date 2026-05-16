import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerSearchForm } from "@/components/customers/customer-search-form";
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Customers</h1>
          <p className="mt-1 text-slate-400">
            {customers.length} {customers.length === 1 ? "customer" : "customers"}
            {filters.q ? (
              <span className="text-slate-500"> matching &ldquo;{filters.q}&rdquo;</span>
            ) : null}
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          New customer
        </Link>
      </header>

      <CustomerSearchForm params={filters} />
      <CustomerList customers={customers} />
    </div>
  );
}
