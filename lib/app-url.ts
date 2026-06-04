/** Canonical app origin for share links and emails. */
export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function publicReportUrl(shareToken: string): string {
  return `${getAppOrigin()}/r/${shareToken}`;
}

export function publicQuoteUrl(shareToken: string): string {
  return `${getAppOrigin()}/q/${shareToken}`;
}

export function publicCustomerPortalUrl(portalToken: string): string {
  return `${getAppOrigin()}/portal/${portalToken}`;
}
