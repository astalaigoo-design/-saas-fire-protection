/** True when Resend is configured for post-submit report emails. */
export function isReportEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.REPORT_EMAIL_FROM?.trim(),
  );
}

export function getReportEmailFrom(): string | null {
  const from = process.env.REPORT_EMAIL_FROM?.trim();
  return from || null;
}
