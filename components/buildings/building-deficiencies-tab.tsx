import Link from "next/link";
import { DeficiencyWorkflowCard } from "@/components/deficiencies/deficiency-workflow-card";
import { DeficiencyStatusBadge } from "@/components/deficiencies/deficiency-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/dashboard/dates";
import type { DeficiencyRow } from "@/lib/deficiencies/queries";

type AssignableStaff = { id: string; name: string | null; role: string };

type BuildingDeficienciesTabProps = {
  open: DeficiencyRow[];
  verified: DeficiencyRow[];
  assignableStaff: AssignableStaff[];
};

export function BuildingDeficienciesTab({
  open,
  verified,
  assignableStaff,
}: BuildingDeficienciesTabProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-foreground">Open violations</h3>
        {open.length === 0 ? (
          <EmptyState
            title="No open deficiencies"
            description="Failed items from inspections at this building appear here with corrective-action tracking."
          />
        ) : (
          <ul className="space-y-4">
            {open.map((deficiency) => (
              <li key={deficiency.id}>
                <DeficiencyWorkflowCard
                  deficiency={deficiency}
                  assignableStaff={assignableStaff}
                  showBuildingLink={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {verified.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Recently verified
          </h3>
          <ul className="space-y-2 rounded-xl border border-border bg-card divide-y divide-border">
            {verified.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Verified {row.verifiedAt ? formatDate(row.verifiedAt) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DeficiencyStatusBadge status={row.status} />
                  <Link
                    href={`/inspect/${row.sourceInspectionId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Source job
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
