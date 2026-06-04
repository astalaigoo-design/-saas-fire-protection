import { auditActionLabel } from "@/lib/audit/labels";
import {
  formatAuditEventSummary,
  type AuditEventForDisplay,
} from "@/lib/audit/format-event";
import { formatDateTime } from "@/lib/dashboard/dates";
import { EmptyState } from "@/components/ui/empty-state";

function actorLabel(event: AuditEventForDisplay): string {
  if (event.actorName?.trim()) return event.actorName.trim();
  if (event.actorEmail?.trim()) return event.actorEmail.trim();
  return "System";
}

type BuildingAssetRegisterHistoryProps = {
  events: AuditEventForDisplay[];
};

export function BuildingAssetRegisterHistory({ events }: BuildingAssetRegisterHistoryProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No register history yet"
        description="Adds, edits, and removals on this building appear here."
        className="py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {events.map((event) => (
        <li key={event.id} className="px-4 py-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-foreground">
                {formatAuditEventSummary(event)}
              </p>
              <p className="text-xs text-muted-foreground">
                {auditActionLabel(event.action)} · {actorLabel(event)}
              </p>
            </div>
            <time
              dateTime={event.createdAt.toISOString()}
              className="shrink-0 text-xs tabular-nums text-muted-foreground"
            >
              {formatDateTime(event.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
