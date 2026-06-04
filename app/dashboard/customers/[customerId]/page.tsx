import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerBranchForm } from "@/components/customers/customer-branch-form";
import { CustomerBuildingsSection } from "@/components/customers/customer-buildings-section";
import { CustomerContactsSection } from "@/components/customers/customer-contacts-section";
import { CustomerInspectionHistory } from "@/components/customers/customer-inspection-history";
import { CustomerMergeForm } from "@/components/customers/customer-merge-form";
import { CustomerPortalSection } from "@/components/customers/customer-portal-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listBranchesForCompany } from "@/lib/branches/queries";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { canManageJobs } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/dashboard/dates";
import { listMergeCandidateCustomers } from "@/lib/customers/duplicates";
import {
  getCustomerById,
  getCustomerInspectionHistory,
} from "@/lib/customers/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type CustomerDetailPageProps = {
  params: { customerId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const [customer, inspections, branches, mergeCandidates] = await Promise.all([
    getCustomerById(session, params.customerId),
    getCustomerInspectionHistory(session, params.customerId),
    canFilterBranchesByCookie(session)
      ? listBranchesForCompany(session.companyId)
      : Promise.resolve([]),
    listMergeCandidateCustomers(session, params.customerId),
  ]);

  if (!customer) notFound();

  const canManageCustomerBranch = canFilterBranchesByCookie(session);
  const showMergedBanner = searchParams?.merged === "1";

  return (
    <div className="space-y-8">
      {showMergedBanner ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
        >
          Duplicate customer merged — buildings and contacts are now on this account.
        </p>
      ) : null}
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
              <span>Added {formatDate(customer.createdAt)}</span>
              {!canManageCustomerBranch && customer.branch?.name ? (
                <span>Branch · {customer.branch.name}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link
              href={`/dashboard/buildings/new?customerId=${customer.id}`}
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
            >
              Add building
            </Link>
          </div>
        </div>
      </header>

      {canManageCustomerBranch ? (
        <section
          aria-labelledby="customer-branch-heading"
          className="max-w-lg rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h2
            id="customer-branch-heading"
            className="font-heading text-base font-semibold text-foreground"
          >
            Branch
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Move this customer to another office or region. Buildings and jobs stay with the
            account; dashboards and filters use the branch you choose.
          </p>
          <div className="mt-4">
            <CustomerBranchForm
              customerId={customer.id}
              branchId={customer.branchId}
              branches={branches}
            />
          </div>
        </section>
      ) : null}

      <CustomerContactsSection customer={customer} />

      <CustomerPortalSection
        customerId={customer.id}
        portalToken={customer.portalToken}
        portalEnabledAt={customer.portalEnabledAt?.toISOString() ?? null}
      />

      <CustomerMergeForm
        customerId={customer.id}
        customerName={customer.name}
        candidates={mergeCandidates}
      />

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
