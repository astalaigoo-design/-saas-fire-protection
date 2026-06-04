/** What repair quotes do in Flareflow — internal pipeline, not invoicing. */
export const REPAIR_QUOTE_CAPABILITIES = [
  "Draft quotes auto-created from failed inspection items",
  "Review line items, preview PDF, and email report + quote to the customer",
  "Customer accept, decline, or request changes on the public link (/q/…)",
  "Schedule a follow-up job after the customer accepts",
  "Sync status to CMMS via webhooks or GET /api/v1 (Organization → Integrations)",
] as const;

/** Explicitly out of scope for repair quotes (use your accounting stack separately). */
export const REPAIR_QUOTE_NOT_INCLUDED = [
  "QuickBooks, Xero, or other accounting invoice sync",
  "Stripe or card payment when the customer accepts",
  "Sales tax calculation or formal invoicing",
] as const;

/** Shown on the customer quote link — acceptance is approval only. */
export const REPAIR_QUOTE_ACCEPT_DISCLAIMER =
  "Accepting records approval for the contractor. It does not charge a card or create an invoice.";
