import Link from "next/link";
import type { CustomerSearchParams } from "@/lib/customers/schemas";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomerSearchFormProps = {
  params: CustomerSearchParams;
};

export function CustomerSearchForm({ params }: CustomerSearchFormProps) {
  const hasFilters =
    Boolean(params.q) || params.buildings !== "all" || params.sort !== "name_asc";

  return (
    <Card>
      <CardContent>
        <form method="get" action="/dashboard/customers" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="customer-search-q">Search</Label>
              <Input
                id="customer-search-q"
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Name, email, phone, or building…"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-search-buildings">Buildings</Label>
              <select
                id="customer-search-buildings"
                name="buildings"
                defaultValue={params.buildings}
                className={nativeSelectClassName}
              >
                <option value="all">All customers</option>
                <option value="with">With buildings</option>
                <option value="without">No buildings yet</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-search-sort">Sort</Label>
              <select
                id="customer-search-sort"
                name="sort"
                defaultValue={params.sort}
                className={nativeSelectClassName}
              >
                <option value="name_asc">Name (A–Z)</option>
                <option value="name_desc">Name (Z–A)</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5")}>
              Apply filters
            </button>
            {hasFilters ? (
              <Link
                href="/dashboard/customers"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
