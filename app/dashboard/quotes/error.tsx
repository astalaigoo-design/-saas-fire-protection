"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function QuotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <h2 className="font-heading text-lg font-semibold text-foreground">Could not load quotes</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try again in a moment.</p>
      <Button type="button" onClick={reset} className="mt-4 min-h-10">
        Retry
      </Button>
    </div>
  );
}
