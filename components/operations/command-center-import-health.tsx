import Link from "next/link";
import { formatDate } from "@/lib/dashboard/dates";
import type { ImportHealthSnapshot } from "@/lib/operations/import-health";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CommandCenterImportHealthProps = {
  health: ImportHealthSnapshot;
};

export function CommandCenterImportHealth({ health }: CommandCenterImportHealthProps) {
  const totalImports =
    health.recentImports.customers +
    health.recentImports.buildings +
    health.recentImports.equipment +
    health.recentImports.scheduleJobs;

  const hasGaps =
    health.buildingsWithoutRegister > 0 || health.assetsMissingNextDue > 0;

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Data & import health</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          CSV onboarding in the last 90 days and register gaps that block equipment due reporting.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">CSV activity (90 days)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {totalImports}
            </p>
            <p className="text-xs text-muted-foreground">
              {health.recentImports.customers} customers · {health.recentImports.buildings}{" "}
              buildings · {health.recentImports.equipment} equipment ·{" "}
              {health.recentImports.scheduleJobs} schedule rows
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Last CSV import</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {health.lastImportAt ? formatDate(health.lastImportAt) : "None on record"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Sites without register</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {health.buildingsWithoutRegister}
            </p>
            <p className="text-xs text-muted-foreground">
              of {health.buildingsInScope} buildings in scope
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Active assets missing due date</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {health.assetsMissingNextDue}
            </p>
            <p className="text-xs text-muted-foreground">
              of {health.activeAssets} register items
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/customers/import"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          >
            Import customers
          </Link>
          <Link
            href="/dashboard/buildings/import"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          >
            Import buildings
          </Link>
          <Link
            href="/dashboard/buildings/import-equipment"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          >
            Import equipment
          </Link>
          <Link
            href="/dashboard/jobs/import"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          >
            Import schedule
          </Link>
        </div>

        {hasGaps && health.registerGaps.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-foreground">Sites missing equipment register</h3>
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {health.registerGaps.map((row) => (
                <li
                  key={row.buildingId}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/buildings/${row.buildingId}?tab=assets`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {row.buildingLabel}
                    </Link>
                    <p className="text-sm text-muted-foreground">{row.customerName}</p>
                  </div>
                  <Link
                    href={`/dashboard/buildings/${row.buildingId}?tab=assets`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                  >
                    Add equipment
                  </Link>
                </li>
              ))}
            </ul>
            {health.buildingsWithoutRegister > health.registerGaps.length ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing {health.registerGaps.length} of {health.buildingsWithoutRegister} sites
                without register rows.
              </p>
            ) : null}
          </div>
        ) : hasGaps ? (
          <p className="text-sm text-muted-foreground">
            {health.assetsMissingNextDue > 0
              ? "Set next service due on equipment rows so Command center can flag overdue extinguishers and panels."
              : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Registers look healthy — equipment due dates will appear on the Equipment tab when
            next service dates are set.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
