"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function EquipmentImportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFeedback
      title="Could not load equipment import"
      fallbackMessage="Something went wrong loading the equipment import page. Try again in a moment."
      error={error}
      onRetry={reset}
    />
  );
}
