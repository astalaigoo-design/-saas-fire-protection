import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";

export function getSentryDsn(): string | undefined {
  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return dsn || undefined;
}

export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
}

function tracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE?.trim();
  if (raw) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }
  return getSentryEnvironment() === "production" ? 0.1 : 1;
}

/** Shared Sentry init options (server, edge, and browser). */
export function buildSentryOptions(): BrowserOptions & NodeOptions & EdgeOptions {
  const dsn = getSentryDsn();
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: getSentryEnvironment(),
    tracesSampleRate: tracesSampleRate(),
    sendDefaultPii: false,
  };
}
