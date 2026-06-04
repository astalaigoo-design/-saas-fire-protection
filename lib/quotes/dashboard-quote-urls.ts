import { getAppOrigin } from "@/lib/app-url";

export function dashboardQuotesUrl(options?: {
  quoteId?: string;
  stage?: string;
}): string {
  const base = `${getAppOrigin()}/dashboard/quotes`;
  const params = new URLSearchParams();
  if (options?.stage) params.set("stage", options.stage);
  if (options?.quoteId) params.set("quote", options.quoteId);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** @deprecated Use dashboardQuotesUrl — redirects from legacy Reports links. */
export function dashboardReportsUrl(quoteId?: string): string {
  return dashboardQuotesUrl({ quoteId });
}

/** One-click schedule (requires sign-in); redirects to calendar on success. */
export function dashboardScheduleReinspectionFromQuoteUrl(quoteId: string): string {
  return `${getAppOrigin()}/dashboard/quotes/${encodeURIComponent(quoteId)}/schedule-follow-up`;
}
