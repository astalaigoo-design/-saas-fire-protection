"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function NewWorkOrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load work order form"
      fallbackMessage="Something went wrong loading the new work order form. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
