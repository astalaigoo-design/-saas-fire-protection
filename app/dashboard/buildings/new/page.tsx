import { redirect } from "next/navigation";
import { NewBuildingForm } from "@/components/buildings/new-building-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { listJurisdictionOptions } from "@/lib/jurisdictions/queries";
import { prisma } from "@/lib/prisma";

type NewBuildingPageProps = {
  searchParams?: { customerId?: string };
};

export default async function NewBuildingPage({ searchParams }: NewBuildingPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const [customers, jurisdictions] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listJurisdictionOptions(session.companyId),
  ]);

  if (customers.length === 0) redirect("/dashboard/customers/new");

  return (
    <div className="space-y-6">
      <PageHeader
        title="New building"
        description="Add a site to one of your customers before scheduling inspections."
      />
      <NewBuildingForm
        customers={customers}
        jurisdictions={jurisdictions}
        initialCustomerId={searchParams?.customerId}
      />
    </div>
  );
}
