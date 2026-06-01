/** React-PDF struggles with very large data URLs; cap size and count for reliable PDFs. */
const MAX_DATA_URL_LENGTH = 1_500_000;
const MAX_PHOTOS_IN_PDF = 6;

export function isPdfSafeImageUrl(url: string): boolean {
  if (!url.startsWith("data:image/")) return url.startsWith("http://") || url.startsWith("https://");
  return url.length <= MAX_DATA_URL_LENGTH;
}

export function filterPhotosForPdf<T extends { url: string }>(photos: T[]): T[] {
  return photos.filter((photo) => isPdfSafeImageUrl(photo.url)).slice(0, MAX_PHOTOS_IN_PDF);
}

export function sanitizeSignatureForPdf(signatureData: string | null): string | null {
  if (!signatureData) return null;
  if (!signatureData.startsWith("data:image/")) return null;
  if (signatureData.length > MAX_DATA_URL_LENGTH) return null;
  return signatureData;
}

const MAX_LOGO_DATA_URL_LENGTH = 500_000;

/** Company logo from organization settings (data URL or HTTPS). */
export function sanitizeCompanyLogoForPdf(
  logoUrl: string | null | undefined,
): string | null {
  if (!logoUrl?.trim()) return null;
  const url = logoUrl.trim();
  if (url.startsWith("data:image/")) {
    if (url.length > MAX_LOGO_DATA_URL_LENGTH) return null;
    return url;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return null;
}
