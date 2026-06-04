import Link from "next/link";
import type { DuplicateCustomerGroup } from "@/lib/customers/duplicates";

type CustomerDuplicatesBannerProps = {
  groups: DuplicateCustomerGroup[];
};

export function CustomerDuplicatesBanner({ groups }: CustomerDuplicatesBannerProps) {
  if (groups.length === 0) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-foreground"
    >
      <p className="font-medium">Possible duplicate customers</p>
      <p className="mt-1 text-muted-foreground">
        Review matching names or emails and merge accounts from a customer profile.
      </p>
      <ul className="mt-3 space-y-2">
        {groups.slice(0, 5).map((group) => (
          <li key={`${group.reason}-${group.key}`}>
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {group.reason === "email" ? "Same email" : "Similar name"}
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {group.customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/dashboard/customers/${customer.id}`}
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm hover:bg-muted"
                >
                  {customer.name}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {groups.length > 5 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          +{groups.length - 5} more duplicate groups
        </p>
      ) : null}
    </div>
  );
}
