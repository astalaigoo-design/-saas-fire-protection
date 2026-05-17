"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-50">
      <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-red-950/30 p-6">
        <h1 className="text-lg font-semibold text-red-200">Something went wrong</h1>
        <p className="mt-2 text-sm text-red-300/80">
          {error.message || "The app could not load this page."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
