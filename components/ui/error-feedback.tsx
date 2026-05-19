"use client";

type ErrorFeedbackProps = {
  title: string;
  fallbackMessage: string;
  error?: Error & { digest?: string };
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

function getSafeUserMessage(error: Error | undefined, fallbackMessage: string): string {
  const raw = error?.message?.trim();
  if (!raw) return fallbackMessage;

  const technicalPatterns = [
    "database_url",
    "direct_url",
    "prisma",
    "p1000",
    "stack",
    "sql",
    "env",
  ];

  const normalized = raw.toLowerCase();
  if (technicalPatterns.some((token) => normalized.includes(token))) {
    return fallbackMessage;
  }

  return raw;
}

export function ErrorFeedback({
  title,
  fallbackMessage,
  error,
  retryLabel = "Try again",
  onRetry,
  className,
}: ErrorFeedbackProps) {
  const userMessage = getSafeUserMessage(error, fallbackMessage);
  const showDebugDetails = process.env.NODE_ENV !== "production" && error?.message;

  return (
    <div className={className ?? "rounded-xl border border-red-900/50 bg-red-950/30 p-6"}>
      <h2 className="text-lg font-semibold text-red-200">{title}</h2>
      <p className="mt-2 text-sm text-red-300/80">{userMessage}</p>
      <p className="mt-2 text-xs text-red-300/70">
        If it keeps happening, refresh the page and try again.
      </p>
      {error?.digest ? (
        <p className="mt-2 text-xs text-red-300/60">Reference: {error.digest}</p>
      ) : null}

      {showDebugDetails ? (
        <details className="mt-3 text-xs text-red-200/80">
          <summary className="cursor-pointer">Technical details</summary>
          <p className="mt-2 break-words">{error.message}</p>
        </details>
      ) : null}

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
