"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load reports"
      fallbackMessage="Something went wrong loading compliance reports. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
