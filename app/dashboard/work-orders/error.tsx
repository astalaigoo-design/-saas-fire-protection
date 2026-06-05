"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function WorkOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load work orders"
      fallbackMessage="Something went wrong loading work orders. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
