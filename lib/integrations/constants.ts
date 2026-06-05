import type { IntegrationWebhookEvent } from "@prisma/client";

/** Wire format for webhook JSON `event` field. */
export const WEBHOOK_EVENT_WIRE: Record<IntegrationWebhookEvent, string> = {
  inspection_completed: "inspection.completed",
  report_finalized: "report.finalized",
  quote_updated: "quote.updated",
  deficiency_created: "deficiency.created",
  customer_created: "customer.created",
  inspection_scheduled: "inspection.scheduled",
};

export const ALL_WEBHOOK_EVENTS: IntegrationWebhookEvent[] = [
  "inspection_completed",
  "report_finalized",
  "quote_updated",
  "deficiency_created",
  "customer_created",
  "inspection_scheduled",
];

export const WEBHOOK_EVENT_LABELS: Record<IntegrationWebhookEvent, string> = {
  inspection_completed: "Inspection completed",
  report_finalized: "Compliance report finalized",
  quote_updated: "Quote status updated",
  deficiency_created: "Deficiency opened",
  customer_created: "Customer created (API or dashboard)",
  inspection_scheduled: "Inspection scheduled (API or dashboard)",
};

export const API_KEY_PREFIX = "ff_live_";
