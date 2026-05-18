import Link from "next/link";
import { buildingAddressLine, buildingLabel } from "@/lib/customers/format";
import type { CustomerDetail } from "@/lib/customers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type CustomerBuildingsSectionProps = {
  buildings: CustomerDetail["buildings"];
};

export function CustomerBuildingsSection({ buildings }: CustomerBuildingsSectionProps) {
  if (buildings.length === 0) {
    return (
      <EmptyState
        title="No buildings on file"
        description="Add a site when creating or editing this customer."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {buildings.map((building) => (
        <li key={building.id}>
          <Link
            href={`/dashboard/buildings/${building.id}`}
            className="block rounded-xl transition-opacity hover:opacity-95"
          >
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground">{buildingLabel(building)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{buildingAddressLine(building)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {building.region} {building.postalCode}
                  {building.country !== "US" ? ` · ${building.country}` : ""}
                </p>
                <p className="mt-3 text-sm text-primary">
                  {building._count.inspections}{" "}
                  {building._count.inspections === 1 ? "inspection" : "inspections"}
                  <span className="sr-only"> — view building</span>
                </p>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
