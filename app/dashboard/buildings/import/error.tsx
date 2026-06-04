"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function BuildingImportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load import"
      fallbackMessage="Something went wrong loading the import page."
      error={error}
      onRetry={reset}
    />
  );
}
