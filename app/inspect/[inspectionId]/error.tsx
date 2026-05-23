"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function InspectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-slate-950 p-6">
      <ErrorFeedback
        title="Could not load inspection"
        fallbackMessage="Something went wrong while opening this inspection. If you just updated the app, close it fully and reopen while online."
        error={error}
        onRetry={reset}
      />
    </div>
  );
}
