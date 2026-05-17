"use client";

export default function MyJobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6">
      <h2 className="text-lg font-semibold text-red-200">Could not load jobs</h2>
      <p className="mt-2 text-sm text-red-300/80">
        {error.message || "Something went wrong while loading your assigned inspections."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}
