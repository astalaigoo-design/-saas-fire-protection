"use client";

import Link from "next/link";

type CustomerPortalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CustomerPortalError({ reset }: CustomerPortalErrorProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-50">
      <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        We could not load this portal. Try again, or contact your fire protection contractor.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-800 px-5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Go to FlareFlow
        </Link>
      </div>
    </main>
  );
}
