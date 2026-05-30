import Link from "next/link";
import { CheckIcon, CircleIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnboardingProgress } from "@/lib/dashboard/onboarding";
import { cn } from "@/lib/utils";

type OnboardingChecklistProps = {
  progress: OnboardingProgress;
};

export function OnboardingChecklist({ progress }: OnboardingChecklistProps) {
  if (progress.isComplete) return null;

  const percent = Math.round((progress.completedCount / progress.totalCount) * 100);
  const nextStep = progress.steps.find((step) => !step.done);

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
      <CardHeader className="gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-heading text-xl">Get started in 5 minutes</CardTitle>
            <CardDescription>
              Set up your workspace once — then schedule, inspect, and send compliance reports.
            </CardDescription>
          </div>
          <p className="shrink-0 text-sm font-medium tabular-nums text-primary">
            {progress.completedCount} of {progress.totalCount} complete
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={progress.completedCount}
            aria-valuemin={0}
            aria-valuemax={progress.totalCount}
            aria-label="Onboarding progress"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-4">
        <ol className="space-y-2">
          {progress.steps.map((step, index) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                  step.done
                    ? "border-border/60 bg-muted/30 text-muted-foreground"
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    step.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {step.done ? (
                    <CheckIcon className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <CircleIcon className="size-3.5" strokeWidth={2} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        step.done ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {index + 1}. {step.title}
                    </span>
                    {!step.done && step.id === nextStep?.id ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Next
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {nextStep ? (
          <div className="pt-2">
            <Link href={nextStep.href} className={cn(buttonVariants(), "min-h-11 w-full sm:w-auto")}>
              Continue: {nextStep.title}
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
