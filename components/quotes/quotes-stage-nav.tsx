import Link from "next/link";
import type { QuotePipelineMetrics, QuotePipelineStage } from "@/lib/quotes/pipeline";
import { cn } from "@/lib/utils";

const STAGE_LINKS: { stage: QuotePipelineStage; label: string; countKey: keyof QuotePipelineMetrics["counts"] }[] = [
  { stage: "all", label: "All", countKey: "all" },
  { stage: "draft", label: "Draft", countKey: "draft" },
  { stage: "awaiting", label: "Awaiting response", countKey: "awaiting" },
  { stage: "accepted", label: "Accepted", countKey: "accepted" },
  { stage: "declined", label: "Declined", countKey: "declined" },
];

type QuotesStageNavProps = {
  activeStage: QuotePipelineStage;
  counts: QuotePipelineMetrics["counts"];
};

export function QuotesStageNav({ activeStage, counts }: QuotesStageNavProps) {
  return (
    <nav
      aria-label="Quote pipeline filters"
      className="flex gap-1 overflow-x-auto border-b border-border pb-px"
    >
      {STAGE_LINKS.map(({ stage, label, countKey }) => {
        const active = activeStage === stage;
        return (
          <Link
            key={stage}
            href={stage === "all" ? "/dashboard/quotes" : `/dashboard/quotes?stage=${stage}`}
            className={cn(
              "shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-primary bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {label}
            <span className="ml-1.5 tabular-nums text-muted-foreground">({counts[countKey]})</span>
          </Link>
        );
      })}
    </nav>
  );
}
