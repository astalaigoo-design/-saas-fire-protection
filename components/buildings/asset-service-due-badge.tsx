import { cn } from "@/lib/utils";

export type AssetServiceDueBadgeStatus = "overdue" | "due_soon";

type AssetServiceDueBadgeProps = {
  status: AssetServiceDueBadgeStatus;
  className?: string;
};

export function AssetServiceDueBadge({ status, className }: AssetServiceDueBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "overdue" && "bg-destructive/15 text-destructive",
        status === "due_soon" && "bg-amber-500/15 text-amber-900 dark:text-amber-100",
        className,
      )}
    >
      {status === "overdue" ? "Overdue" : "Due soon"}
    </span>
  );
}
