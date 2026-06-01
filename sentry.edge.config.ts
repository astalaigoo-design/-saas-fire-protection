import * as Sentry from "@sentry/nextjs";
import { buildSentryOptions } from "@/lib/monitoring/sentry-options";

Sentry.init(buildSentryOptions());
