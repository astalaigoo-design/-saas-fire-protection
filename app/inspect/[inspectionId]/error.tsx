"use client";

export default function InspectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-slate-950 p-6">
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6">
        <h2 className="text-lg font-semibold text-red-200">Could not load inspection</h2>
        <p className="mt-2 text-sm text-red-300/80">
          {error.message || "Something went wrong."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-800 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
