"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function CommandCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load command center"
      fallbackMessage="We couldn't load compliance workload data. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
