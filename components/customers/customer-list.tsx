import Link from "next/link";
import { buildingLabel } from "@/lib/customers/format";
import type { CustomerListItem } from "@/lib/customers/queries";

type CustomerListProps = {
  customers: CustomerListItem[];
};

export function CustomerList({ customers }: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">
        No customers match your search. Try different filters or add a new customer.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {customers.map((customer) => (
        <li key={customer.id}>
          <Link
            href={`/dashboard/customers/${customer.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-900/90"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold text-white">{customer.name}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-400">
                  {customer.email ? <span>{customer.email}</span> : null}
                  {customer.phone ? <span>{customer.phone}</span> : null}
                  {!customer.email && !customer.phone ? (
                    <span className="text-slate-500">No contact info</span>
                  ) : null}
                </div>
              </div>
              <span className="shrink-0 text-sm text-slate-500">
                {customer._count.buildings}{" "}
                {customer._count.buildings === 1 ? "building" : "buildings"}
              </span>
            </div>
            {customer.buildings.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-slate-800/80 pt-4">
                {customer.buildings.map((building) => (
                  <li
                    key={building.id}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/80" aria-hidden />
                    <span>{buildingLabel(building)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-t border-slate-800/80 pt-4 text-sm text-slate-500">
                No buildings yet
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
