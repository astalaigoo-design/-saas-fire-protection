import * as Sentry from "@sentry/nextjs";
import { getSentryDsn } from "@/lib/monitoring/sentry-options";

export function isMonitoringEnabled(): boolean {
  return Boolean(getSentryDsn());
}

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: Sentry.SeverityLevel;
};

export function captureError(error: unknown, context?: CaptureContext): void {
  if (!isMonitoringEnabled()) return;

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }
    if (context?.level) {
      scope.setLevel(context.level);
    }
    Sentry.captureException(error);
  });
}

/** Log to console and report to Sentry (API Route handlers). */
export function captureRouteError(
  route: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  console.error(route, error);
  captureError(error, {
    tags: { layer: "api_route", route },
    extra,
  });
}

/** Log to console and report to Sentry (Server Actions). */
export function captureServerActionError(
  action: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  console.error(`${action} failed`, error);
  captureError(error, {
    tags: { layer: "server_action", serverAction: action },
    extra,
  });
}
