"use client";

export default function BuildingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
      <h2 className="text-lg font-semibold text-destructive">Could not load building</h2>
      <p className="mt-2 text-sm text-destructive/90">
        {error.message || "Something went wrong loading this site."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-destructive px-4 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
