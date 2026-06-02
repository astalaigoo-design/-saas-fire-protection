import { getAppOrigin } from "@/lib/app-url";

export function dashboardReportsUrl(quoteId?: string): string {
  const base = `${getAppOrigin()}/dashboard/reports`;
  if (!quoteId) return base;
  return `${base}?quote=${encodeURIComponent(quoteId)}`;
}

/** One-click schedule (requires sign-in); redirects to calendar on success. */
export function dashboardScheduleReinspectionFromQuoteUrl(quoteId: string): string {
  return `${getAppOrigin()}/dashboard/quotes/${encodeURIComponent(quoteId)}/schedule-follow-up`;
}
