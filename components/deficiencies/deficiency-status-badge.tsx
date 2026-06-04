import { DeficiencyStatus } from "@prisma/client";
import { DEFICIENCY_STATUS_LABELS } from "@/lib/deficiencies/status";
import { cn } from "@/lib/utils";

const styles: Record<DeficiencyStatus, string> = {
  [DeficiencyStatus.open]: "bg-destructive/10 text-destructive",
  [DeficiencyStatus.owned]: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  [DeficiencyStatus.resolved]: "bg-sky-500/15 text-sky-900 dark:text-sky-100",
  [DeficiencyStatus.verified]: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
};

export function DeficiencyStatusBadge({ status }: { status: DeficiencyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {DEFICIENCY_STATUS_LABELS[status]}
    </span>
  );
}
