"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function WorkOrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load work order"
      fallbackMessage="Something went wrong loading this work order. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
