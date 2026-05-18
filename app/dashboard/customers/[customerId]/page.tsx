import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerBuildingsSection } from "@/components/customers/customer-buildings-section";
import { CustomerInspectionHistory } from "@/components/customers/customer-inspection-history";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
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

  const [customer, inspections] = await Promise.all([
    getCustomerById(session.companyId, params.customerId),
    getCustomerInspectionHistory(session.companyId, params.customerId),
  ]);

  if (!customer) notFound();

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
          </div>
        </div>
      </header>

      <section aria-labelledby="buildings-heading">
        <h2 id="buildings-heading" className="mb-4 font-heading text-lg font-semibold text-foreground">
          Buildings ({customer.buildings.length})
        </h2>
        <CustomerBuildingsSection buildings={customer.buildings} />
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
