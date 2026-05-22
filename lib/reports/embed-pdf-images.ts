import { filterPhotosForPdf, isPdfSafeImageUrl } from "@/lib/reports/pdf-images";

async function embedRemoteImageAsDataUrl(url: string): Promise<string | null> {
  if (url.startsWith("data:")) {
    return isPdfSafeImageUrl(url) ? url : null;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return null;
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 1_500_000) return null;

    const contentType = response.headers.get("content-type");
    const mime =
      contentType && contentType.startsWith("image/") ? contentType : "image/jpeg";

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("embedRemoteImageAsDataUrl failed", url, error);
    return null;
  }
}

export async function embedPhotosForPdf<T extends { url: string }>(
  photos: T[],
): Promise<T[]> {
  const candidates = filterPhotosForPdf(photos);
  const embedded: T[] = [];

  for (const photo of candidates) {
    const dataUrl = photo.url.startsWith("data:")
      ? photo.url
      : await embedRemoteImageAsDataUrl(photo.url);
    if (dataUrl && isPdfSafeImageUrl(dataUrl)) {
      embedded.push({ ...photo, url: dataUrl });
    }
  }

  return embedded;
}
