import Link from "next/link";
import { CustomerBranchForm } from "@/components/customers/customer-branch-form";
import { buildingLabel } from "@/lib/customers/format";
import type { BranchListItem } from "@/lib/branches/queries";
import type { CustomerListItem } from "@/lib/customers/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type CustomerListProps = {
  customers: CustomerListItem[];
  branches?: BranchListItem[];
  canReassignBranch?: boolean;
};

export function CustomerList({
  customers,
  branches = [],
  canReassignBranch = false,
}: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No customers match your search"
        description="Try different filters or add a new customer."
      />
    );
  }

  const showBranchColumn = canReassignBranch || branches.length > 1;

  return (
    <ul className="space-y-3">
      {customers.map((customer) => (
        <li key={customer.id}>
          <Card>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    {customer.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {customer.email ? <span>{customer.email}</span> : null}
                    {customer.phone ? <span>{customer.phone}</span> : null}
                    {!customer.email && !customer.phone ? (
                      <span>No contact info</span>
                    ) : null}
                    {showBranchColumn && customer.branch?.name && !canReassignBranch ? (
                      <span>Branch · {customer.branch.name}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  {canReassignBranch && branches.length > 0 ? (
                    <div className="flex flex-col gap-1 sm:items-end">
                      <span className="text-xs font-medium text-muted-foreground">Branch</span>
                      <CustomerBranchForm
                        customerId={customer.id}
                        branchId={customer.branchId}
                        branches={branches}
                      />
                    </div>
                  ) : null}
                  <Badge variant="outline" className="shrink-0 self-start sm:self-auto">
                    {customer._count.buildings}{" "}
                    {customer._count.buildings === 1 ? "building" : "buildings"}
                  </Badge>
                </div>
              </div>
              {customer.buildings.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {customer.buildings.map((building) => (
                    <li key={building.id}>
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="flex items-start gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span>{buildingLabel(building)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    No buildings yet
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
