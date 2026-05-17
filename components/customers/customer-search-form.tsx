import Link from "next/link";
import type { CustomerSearchParams } from "@/lib/customers/schemas";

type CustomerSearchFormProps = {
  params: CustomerSearchParams;
};

export function CustomerSearchForm({ params }: CustomerSearchFormProps) {
  const hasFilters =
    Boolean(params.q) || params.buildings !== "all" || params.sort !== "name_asc";

  return (
    <form
      method="get"
      action="/dashboard/customers"
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1.5 sm:col-span-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-300">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, email, phone, or building…"
            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Buildings</span>
          <select
            name="buildings"
            defaultValue={params.buildings}
            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All customers</option>
            <option value="with">With buildings</option>
            <option value="without">No buildings yet</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Sort</span>
          <select
            name="sort"
            defaultValue={params.sort}
            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          Apply filters
        </button>
        {hasFilters ? (
          <Link
            href="/dashboard/customers"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
