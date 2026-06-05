import Link from "next/link";
import { redirect } from "next/navigation";
import { ComplianceBadge } from "@/components/buildings/compliance-badge";
import { PermitStatusBadge } from "@/components/buildings/permit-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { listCompanyBuildings } from "@/lib/buildings/queries";
import { buildPermitTrackingRows, countPermitTotals } from "@/lib/buildings/permit-tracking";
import { computePermitStatus } from "@/lib/buildings/permit-status";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function BuildingsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  const buildings = await listCompanyBuildings(session);
  const permitTotals = countPermitTotals(buildPermitTrackingRows(buildings));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildings"
        description="All sites across your customers. Open a building for inspections, photos, and reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/buildings/import-equipment"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
            >
              Import equipment
            </Link>
            <Link
              href="/dashboard/buildings/import"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
            >
              Import buildings
            </Link>
            <Link
              href="/dashboard/buildings/new"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}
            >
              Add building
            </Link>
            {buildings.length > 0 ? (
              <a
                href="/api/reports/export?type=ahj-permit-register"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
              >
                Export AHJ register
              </a>
            ) : null}
          </div>
        }
      />

      {buildings.length > 0 && permitTotals.needsAttention > 0 ? (
        <p className="text-sm text-muted-foreground">
          {permitTotals.needsAttention} building{permitTotals.needsAttention === 1 ? "" : "s"} need
          permit attention — expired, expiring within 60 days, missing on file, or no expiry date.
        </p>
      ) : null}

      {buildings.length === 0 ? (
        <EmptyState
          title="No buildings yet"
          description="Import a CSV for many sites, add one building, or create sites from a customer profile."
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{buildingLabel(building)}</p>
                        <PermitStatusBadge
                          status={computePermitStatus({
                            permitNumber: building.permitNumber,
                            permitExpiresAt: building.permitExpiresAt,
                          })}
                        />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {building.customer.name} · {building.city}, {building.region}
                        {building.fireDistrict ? ` · ${building.fireDistrict}` : ""}
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
