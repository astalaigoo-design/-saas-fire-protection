"use client";

import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RepairInvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Repair invoices page error", error);
  }, [error]);

  return (
    <div className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">Could not load invoices</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Something went wrong loading repair invoices."}
      </p>
      <button type="button" onClick={reset} className={cn(buttonVariants(), "min-h-10")}>
        Try again
      </button>
    </div>
  );
}
