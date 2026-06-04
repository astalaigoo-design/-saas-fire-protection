/** Google Maps search URL for a street address (opens in browser / maps app). */
export function buildMapsSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}
