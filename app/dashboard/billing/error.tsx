"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Billing page error", error);
  }, [error]);

  return (
    <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Could not load billing
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Try again. If the problem continues, contact support.
      </p>
      <Button type="button" className="mt-4 min-h-11" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
