"use client";

import { useEffect } from "react";
import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function PartsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Parts catalog page error", error);
  }, [error]);

  return (
    <ErrorFeedback
      title="Could not load parts catalog"
      fallbackMessage="Something went wrong loading your parts inventory. Try again in a moment."
      error={error}
      hint="After an app update, close GetFlareflow completely and reopen it online. If the catalog still fails, contact support with the reference number below."
      onRetry={reset}
      className="rounded-xl border border-red-900/50 bg-red-950/30 p-6"
    />
  );
}
