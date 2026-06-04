/** Shared message when cron/automation skips because Resend env vars are missing. */
export const OUTBOUND_EMAIL_NOT_CONFIGURED =
  "Outbound email (Resend) is not configured — set RESEND_API_KEY and REPORT_EMAIL_FROM on the server.";

/** True when Resend outbound email is configured (all operational mail uses this gate). */
export function isOutboundEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.REPORT_EMAIL_FROM?.trim(),
  );
}

export function getReportEmailFrom(): string | null {
  const from = process.env.REPORT_EMAIL_FROM?.trim();
  return from || null;
}

export type OutboundEmailStatus = {
  configured: boolean;
  fromAddress: string | null;
};

export function getOutboundEmailStatus(): OutboundEmailStatus {
  return {
    configured: isOutboundEmailConfigured(),
    fromAddress: getReportEmailFrom(),
  };
}
