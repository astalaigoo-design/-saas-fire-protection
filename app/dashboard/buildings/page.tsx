import Link from "next/link";
import { redirect } from "next/navigation";
import { ComplianceBadge } from "@/components/buildings/compliance-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { listCompanyBuildings } from "@/lib/buildings/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function BuildingsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const buildings = await listCompanyBuildings(session.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildings"
        description="All sites across your customers. Open a building for inspections, photos, and reports."
        actions={
          <Link
            href="/dashboard/buildings/new"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
          >
            Add building
          </Link>
        }
      />

      {buildings.length === 0 ? (
        <EmptyState
          title="No buildings yet"
          description="Add buildings from a customer profile."
        />
      ) : (
        <ul className="space-y-3">
          {buildings.map((building) => (
            <li key={building.id}>
              <Link
                href={`/dashboard/buildings/${building.id}`}
                className="block rounded-xl transition-opacity hover:opacity-95"
              >
                <Card>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{buildingLabel(building)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {building.customer.name} · {building.city}, {building.region}
                      </p>
                    </div>
                    <ComplianceBadge level={building.currentStatus} className="shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
