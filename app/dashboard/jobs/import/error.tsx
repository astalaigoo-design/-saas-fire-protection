"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScheduleImportErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ScheduleImportError({ error, reset }: ScheduleImportErrorProps) {
  useEffect(() => {
    console.error("Schedule import page error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="font-heading text-lg font-semibold text-foreground">
        Could not load schedule import
      </h1>
      <p className="text-sm text-muted-foreground">
        Try again, or open the calendar and schedule visits one at a time.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
        >
          Try again
        </button>
        <Link
          href="/dashboard/jobs"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
        >
          Calendar
        </Link>
      </div>
    </div>
  );
}
