"use client";

import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-50">
      <ErrorFeedback
        title="Something went wrong"
        fallbackMessage="The app could not load this page."
        error={error}
        onRetry={reset}
        className="w-full max-w-md rounded-xl border border-red-900/50 bg-red-950/30 p-6"
      />
    </main>
  );
}
