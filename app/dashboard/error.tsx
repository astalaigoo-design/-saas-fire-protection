"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Something went wrong"
      fallbackMessage="We could not load the dashboard."
      error={error}
      onRetry={reset}
    />
  );
}
