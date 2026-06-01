/** Prefix for customer messages appended to quote.notes (public link responses). */
export const CUSTOMER_QUOTE_NOTE_PREFIX = "--- Customer response";

export function formatCustomerQuoteNote(action: "request_changes", message: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${CUSTOMER_QUOTE_NOTE_PREFIX} (${date}) — Requested changes ---\n${message.trim()}`;
}

export function appendCustomerQuoteNote(existing: string | null, block: string): string {
  if (!existing?.trim()) return block;
  return `${existing.trim()}\n\n${block}`;
}

export function hasCustomerQuoteNote(notes: string | null | undefined): boolean {
  return Boolean(notes?.includes(CUSTOMER_QUOTE_NOTE_PREFIX));
}

export function extractLatestCustomerQuoteNote(notes: string | null | undefined): string | null {
  if (!notes?.includes(CUSTOMER_QUOTE_NOTE_PREFIX)) return null;
  const parts = notes.split(CUSTOMER_QUOTE_NOTE_PREFIX);
  const last = parts[parts.length - 1]?.trim();
  if (!last) return null;
  const message = last.replace(/^\s*\([^)]+\)\s*—\s*Requested changes\s*---\s*/i, "").trim();
  return message || null;
}
