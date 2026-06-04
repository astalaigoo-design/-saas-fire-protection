import type { IntegrationWebhookEvent } from "@prisma/client";

/** Wire format for webhook JSON `event` field. */
export const WEBHOOK_EVENT_WIRE: Record<IntegrationWebhookEvent, string> = {
  inspection_completed: "inspection.completed",
  report_finalized: "report.finalized",
  quote_updated: "quote.updated",
  deficiency_created: "deficiency.created",
};

export const ALL_WEBHOOK_EVENTS: IntegrationWebhookEvent[] = [
  "inspection_completed",
  "report_finalized",
  "quote_updated",
  "deficiency_created",
];

export const WEBHOOK_EVENT_LABELS: Record<IntegrationWebhookEvent, string> = {
  inspection_completed: "Inspection completed",
  report_finalized: "Compliance report finalized",
  quote_updated: "Quote status updated",
  deficiency_created: "Deficiency opened",
};

export const API_KEY_PREFIX = "ff_live_";
