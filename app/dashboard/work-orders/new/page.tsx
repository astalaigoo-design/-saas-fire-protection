import { redirect } from "next/navigation";
import { NewWorkOrderForm } from "@/components/work-orders/new-work-order-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listAssignableStaff } from "@/lib/deficiencies/queries";
import { getWorkOrderFormBuildings } from "@/lib/work-orders/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type NewWorkOrderPageProps = {
  searchParams?: {
    buildingId?: string;
    deficiencyId?: string;
    quoteId?: string;
  };
};

export default async function NewWorkOrderPage({ searchParams }: NewWorkOrderPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const [buildings, technicians] = await Promise.all([
    getWorkOrderFormBuildings(session),
    listAssignableStaff(session),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New work order"
        description="Schedule repair or parts work without creating an inspection job."
      />
      <NewWorkOrderForm
        buildings={buildings}
        technicians={technicians}
        defaultBuildingId={searchParams?.buildingId}
        defaultDeficiencyId={searchParams?.deficiencyId}
        defaultQuoteId={searchParams?.quoteId}
      />
    </div>
  );
}
