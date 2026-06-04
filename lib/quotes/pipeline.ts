import { QuoteStatus } from "@prisma/client";
import { hasCustomerQuoteNote } from "@/lib/quotes/customer-response-notes";
import type { QuoteListItem } from "@/lib/dashboard/queries";

export const QUOTE_PIPELINE_STAGES = [
  "all",
  "draft",
  "awaiting",
  "accepted",
  "declined",
] as const;

export type QuotePipelineStage = (typeof QUOTE_PIPELINE_STAGES)[number];

export type QuotePipelineMetrics = {
  openPipelineCents: number;
  draftCents: number;
  sentCents: number;
  acceptedCents: number;
  conversionPercent: number | null;
  counts: {
    all: number;
    draft: number;
    awaiting: number;
    awaitingChanges: number;
    accepted: number;
    acceptedNeedsSchedule: number;
    declined: number;
  };
};

export function computeQuotePipelineMetrics(quotes: QuoteListItem[]): QuotePipelineMetrics {
  const draft = quotes.filter((q) => q.status === QuoteStatus.draft);
  const sent = quotes.filter((q) => q.status === QuoteStatus.sent);
  const accepted = quotes.filter((q) => q.status === QuoteStatus.accepted);
  const declined = quotes.filter((q) => q.status === QuoteStatus.declined);

  const sum = (rows: QuoteListItem[]) =>
    rows.reduce((total, row) => total + row.totalCents, 0);

  const draftCents = sum(draft);
  const sentCents = sum(sent);
  const acceptedCents = sum(accepted);

  const closed = accepted.length + declined.length;
  const conversionPercent =
    closed > 0 ? Math.round((accepted.length / closed) * 100) : null;

  return {
    openPipelineCents: draftCents + sentCents,
    draftCents,
    sentCents,
    acceptedCents,
    conversionPercent,
    counts: {
      all: quotes.length,
      draft: draft.length,
      awaiting: sent.length,
      awaitingChanges: sent.filter((q) => hasCustomerQuoteNote(q.notes)).length,
      accepted: accepted.length,
      acceptedNeedsSchedule: accepted.filter((q) => !q.scheduledInspectionId).length,
      declined: declined.length,
    },
  };
}

export function filterQuotesByStage(
  quotes: QuoteListItem[],
  stage: QuotePipelineStage,
): QuoteListItem[] {
  switch (stage) {
    case "draft":
      return quotes.filter((q) => q.status === QuoteStatus.draft);
    case "awaiting":
      return quotes.filter((q) => q.status === QuoteStatus.sent);
    case "accepted":
      return quotes.filter((q) => q.status === QuoteStatus.accepted);
    case "declined":
      return quotes.filter((q) => q.status === QuoteStatus.declined);
    default:
      return quotes;
  }
}

export function isValidQuotePipelineStage(value: string): value is QuotePipelineStage {
  return (QUOTE_PIPELINE_STAGES as readonly string[]).includes(value);
}
