"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function PartsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load parts catalog"
      fallbackMessage="Something went wrong loading your parts inventory. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
