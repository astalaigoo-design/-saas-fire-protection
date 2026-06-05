import Link from "next/link";
import { PermitStatusBadge } from "@/components/buildings/permit-status-badge";
import { formatDate } from "@/lib/dashboard/dates";
import type { PermitTrackingRow, PermitTrackingTotals } from "@/lib/buildings/permit-tracking";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommandCenterPermitsSectionProps = {
  rows: PermitTrackingRow[];
  totals: PermitTrackingTotals;
};

export function CommandCenterPermitsSection({
  rows,
  totals,
}: CommandCenterPermitsSectionProps) {
  const attention = rows.filter((row) => row.status !== "current").slice(0, 12);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            AHJ / permit tracking
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Per-building fire district, permit number, and expiration. Edit on each building
            profile or import via building CSV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/operations/export?type=permits-expiring"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-10 shrink-0")}
          >
            Export expiring (CSV)
          </a>
          <a
            href="/api/reports/export?type=ahj-permit-register"
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-10 shrink-0")}
          >
            Full register
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <PermitStat label="Expired" value={totals.expired} />
        <PermitStat label="Expiring soon" value={totals.expiringSoon} />
        <PermitStat label="No expiry date" value={totals.noExpiryDate} />
        <PermitStat label="Not on file" value={totals.missing} />
        <PermitStat label="Current" value={totals.current} />
      </div>

      {attention.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          All tracked buildings have current permits on file.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {attention.map((row) => (
            <li key={row.buildingId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/buildings/${row.buildingId}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {row.buildingLabel}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {row.customerName}
                  {row.fireDistrict ? ` · ${row.fireDistrict}` : ""}
                  {row.permitNumber ? ` · ${row.permitNumber}` : ""}
                  {row.permitExpiresAt ? ` · expires ${formatDate(row.permitExpiresAt)}` : ""}
                </p>
              </div>
              <PermitStatusBadge status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PermitStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
