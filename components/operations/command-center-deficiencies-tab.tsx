import { DeficiencyWorkflowCard } from "@/components/deficiencies/deficiency-workflow-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DeficiencyRow } from "@/lib/deficiencies/queries";

type AssignableStaff = { id: string; name: string | null; role: string };

type CommandCenterDeficienciesTabProps = {
  deficiencies: DeficiencyRow[];
  assignableStaff: AssignableStaff[];
};

export function CommandCenterDeficienciesTab({
  deficiencies,
  assignableStaff,
}: CommandCenterDeficienciesTabProps) {
  if (deficiencies.length === 0) {
    return (
      <EmptyState
        title="No open deficiencies"
        description="Failed checklist items become tracked violations with assignee, due date, and open → owned → resolved → verified lifecycle. Passing the same line on a re-inspection verifies automatically."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {deficiencies.map((deficiency) => (
        <li key={deficiency.id}>
          <DeficiencyWorkflowCard
            deficiency={deficiency}
            assignableStaff={assignableStaff}
          />
        </li>
      ))}
    </ul>
  );
}
