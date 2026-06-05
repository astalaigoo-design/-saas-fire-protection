import {
  permitStatusLabel,
  type PermitStatus,
} from "@/lib/buildings/permit-status";
import { cn } from "@/lib/utils";

type PermitStatusBadgeProps = {
  status: PermitStatus;
  className?: string;
};

export function PermitStatusBadge({ status, className }: PermitStatusBadgeProps) {
  if (status === "current") return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "expired" && "bg-destructive/15 text-destructive",
        status === "expiring_soon" && "bg-amber-500/15 text-amber-900 dark:text-amber-100",
        status === "missing" && "bg-muted text-muted-foreground",
        status === "no_expiry_date" && "bg-sky-500/15 text-sky-900 dark:text-sky-100",
        className,
      )}
    >
      {permitStatusLabel(status)}
    </span>
  );
}
