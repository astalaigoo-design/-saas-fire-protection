"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 font-sans">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-neutral-600">
          The error was reported to our monitoring service. You can try again or return to the
          dashboard.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
