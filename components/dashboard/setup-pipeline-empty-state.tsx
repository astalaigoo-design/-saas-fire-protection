import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { SetupPipelineState } from "@/lib/dashboard/setup-pipeline";
import { cn } from "@/lib/utils";

type SetupPipelineEmptyStateProps = {
  pipeline: SetupPipelineState;
  title?: string;
  description?: string;
};

export function SetupPipelineEmptyState({
  pipeline,
  title = "You're one step from your first compliant inspection.",
  description = "Follow the steps below — each one takes about a minute.",
}: SetupPipelineEmptyStateProps) {
  const { steps, nextStep } = pipeline;

  return (
    <EmptyState title={title} description={description}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {steps.map((step, index) => {
            const isNext = step.id === nextStep?.id;
            return (
              <span key={step.id} className="flex items-center gap-2">
                <Link
                  href={step.href}
                  className={cn(
                    buttonVariants({
                      variant: step.done ? "outline" : isNext ? "default" : "outline",
                      size: "sm",
                    }),
                    "min-h-10 gap-1.5",
                    step.done && "border-primary/30 text-primary",
                  )}
                  aria-current={isNext ? "step" : undefined}
                >
                  {step.done ? <CheckIcon className="size-3.5" aria-hidden /> : null}
                  {step.label}
                </Link>
                {index < steps.length - 1 ? (
                  <span className="text-muted-foreground" aria-hidden>
                    →
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
        {nextStep ? (
          <div className="flex flex-col items-center gap-2">
            <Link href={nextStep.href} className={cn(buttonVariants({ size: "lg" }), "min-h-11")}>
              Continue: {nextStep.label}
            </Link>
            {nextStep.id === "schedule" ? (
              <Link
                href={
                  nextStep.href === "/dashboard/jobs/import"
                    ? "/dashboard/jobs/new"
                    : "/dashboard/jobs/import"
                }
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "min-h-10")}
              >
                {nextStep.href === "/dashboard/jobs/import"
                  ? "Or schedule one job"
                  : "Or import many visits from CSV"}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </EmptyState>
  );
}
