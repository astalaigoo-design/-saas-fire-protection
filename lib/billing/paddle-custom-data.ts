/** Reads company id from Paddle checkout `custom_data` (JSON key `company_id`). */
export function readCompanyIdFromPaddleCustomData(
  customData: Record<string, unknown> | null | undefined,
): string | null {
  const raw = customData?.company_id;
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  if (typeof raw === "number") return String(raw);
  return null;
}
