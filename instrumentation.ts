import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Captures errors from Server Components, Server Actions, and Route Handlers (Next.js 15+).
 * Safe to export on Next.js 14 — unused until the framework calls it.
 */
export const onRequestError = Sentry.captureRequestError;
