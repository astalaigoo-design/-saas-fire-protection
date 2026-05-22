import type { InspectionFormData } from "@/lib/inspect/queries";

const MAX_PHOTO_URL_LENGTH = 500_000;

/** Keep RSC → client payloads small and JSON-safe. */
export function serializeInspectionForClient(
  inspection: InspectionFormData,
): InspectionFormData {
  return {
    ...inspection,
    scheduledAt: new Date(inspection.scheduledAt),
    completedAt: inspection.completedAt ? new Date(inspection.completedAt) : null,
    signedAt: inspection.signedAt ? new Date(inspection.signedAt) : null,
    photos: inspection.photos.map((photo) => ({
      ...photo,
      url:
        photo.url.startsWith("data:") && photo.url.length > MAX_PHOTO_URL_LENGTH
          ? ""
          : photo.url,
    })),
    signatureData:
      inspection.signatureData &&
      inspection.signatureData.length > MAX_PHOTO_URL_LENGTH
        ? null
        : inspection.signatureData,
  };
}
