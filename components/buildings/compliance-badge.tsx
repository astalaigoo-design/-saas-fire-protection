import type { ComplianceLevel } from "@/lib/buildings/compliance";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<ComplianceLevel, string> = {
  pass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  fail: "border-red-500/40 bg-red-500/15 text-red-400",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  unknown: "border-border bg-muted text-muted-foreground",
};

const labels: Record<ComplianceLevel, string> = {
  pass: "Compliant",
  fail: "Non-compliant",
  warning: "Needs attention",
  unknown: "No data",
};

type ComplianceBadgeProps = {
  level: ComplianceLevel;
  className?: string;
};

export function ComplianceBadge({ level, className }: ComplianceBadgeProps) {
  return (
    <Badge variant="outline" className={cn("capitalize", styles[level], className)}>
      {labels[level]}
    </Badge>
  );
}
