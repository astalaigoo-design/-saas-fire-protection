/** What repair quotes do in Flareflow — internal pipeline, not SaaS billing. */
export const REPAIR_QUOTE_CAPABILITIES = [
  "Draft quotes auto-created from failed inspection items",
  "Review line items, preview PDF, and email report + quote to the customer",
  "Customer accept, decline, or request changes on the public link (/q/…)",
  "Schedule a follow-up job after the customer accepts",
  "Create repair invoices from accepted quotes (Repair invoices page)",
  "Sync status to CMMS via webhooks or GET /api/v1 (Organization → Integrations)",
] as const;

/** Explicitly out of scope for repair quotes (use your accounting stack separately). */
export const REPAIR_QUOTE_NOT_INCLUDED = [
  "QuickBooks, Xero, or other accounting invoice sync",
  "Stripe or card payment when the customer accepts",
  "Automatic sales tax lookup (enter tax % on the quote draft)",
] as const;

/** Shown on the customer quote link — acceptance is approval only. */
export const REPAIR_QUOTE_ACCEPT_DISCLAIMER =
  "Accepting records approval for the contractor. It does not charge a card — your contractor will send a repair invoice separately.";

/** Repair invoice surface — separate from Paddle subscription billing. */
export const REPAIR_INVOICE_CAPABILITIES = [
  "One invoice per accepted quote with sequential invoice numbers",
  "PDF preview and email to the customer (Resend)",
  "Mark sent and paid — track outstanding repair billing in Flareflow",
] as const;

export const REPAIR_INVOICE_NOT_INCLUDED = [
  "Flareflow subscription billing (Paddle — Organization → Billing)",
  "QuickBooks / Xero sync or online card payments",
] as const;
