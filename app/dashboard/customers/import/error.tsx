"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function CustomerImportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load customer import"
      fallbackMessage="Something went wrong loading the customer import page. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
