import type { ComplianceStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<ComplianceStatus, string> = {
  PASS: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  FAIL: "border-red-500/40 bg-red-500/15 text-red-400",
  PENDING: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  OVERDUE: "border-orange-500/40 bg-orange-500/15 text-orange-300",
};

const labels: Record<ComplianceStatus, string> = {
  PASS: "Compliant",
  FAIL: "Non-compliant",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

type ComplianceBadgeProps = {
  level: ComplianceStatus;
  className?: string;
};

export function ComplianceBadge({ level, className }: ComplianceBadgeProps) {
  return (
    <Badge variant="outline" className={cn(styles[level], className)}>
      {labels[level]}
    </Badge>
  );
}
