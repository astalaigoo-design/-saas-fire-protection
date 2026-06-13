"use client";

import Link from "next/link";
import { ErrorFeedback } from "@/components/ui/error-feedback";

export default function InspectSegmentError({
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
      <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard/my-jobs"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to my jobs
        </Link>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/dashboard/my-jobs";
          }}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-200 hover:bg-slate-900"
        >
          Hard refresh jobs
        </button>
      </div>
    </div>
  );
}
