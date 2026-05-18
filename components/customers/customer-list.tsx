import Link from "next/link";
import { buildingLabel } from "@/lib/customers/format";
import type { CustomerListItem } from "@/lib/customers/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type CustomerListProps = {
  customers: CustomerListItem[];
};

export function CustomerList({ customers }: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No customers match your search"
        description="Try different filters or add a new customer."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {customers.map((customer) => (
        <li key={customer.id}>
          <Link
            href={`/dashboard/customers/${customer.id}`}
            className="block rounded-xl transition-opacity hover:opacity-95"
          >
            <Card>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">{customer.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {customer.email ? <span>{customer.email}</span> : null}
                      {customer.phone ? <span>{customer.phone}</span> : null}
                      {!customer.email && !customer.phone ? (
                        <span>No contact info</span>
                      ) : null}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {customer._count.buildings}{" "}
                    {customer._count.buildings === 1 ? "building" : "buildings"}
                  </Badge>
                </div>
                {customer.buildings.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {customer.buildings.map((building) => (
                      <li
                        key={building.id}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span>{buildingLabel(building)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                    No buildings yet
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
