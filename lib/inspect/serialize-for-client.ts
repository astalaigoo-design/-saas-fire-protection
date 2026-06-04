import type { InspectionFormData } from "@/lib/inspect/queries";

const MAX_PHOTO_URL_LENGTH = 500_000;

/** JSON-safe inspection payload for Server Component → Client Component boundaries. */
export type ClientInspectionFormData = Omit<
  InspectionFormData,
  "scheduledAt" | "completedAt" | "signedAt" | "assetChecks"
> & {
  scheduledAt: string;
  completedAt: string | null;
  signedAt: string | null;
  assetChecks: Array<
    Omit<InspectionFormData["assetChecks"][number], "servicedAt"> & {
      servicedAt: string | null;
    }
  >;
};

export function hydrateInspectionFormData(
  data: ClientInspectionFormData | InspectionFormData,
): InspectionFormData {
  const scheduledAt =
    data.scheduledAt instanceof Date ? data.scheduledAt : new Date(data.scheduledAt);
  const completedAt =
    data.completedAt == null
      ? null
      : data.completedAt instanceof Date
        ? data.completedAt
        : new Date(data.completedAt);
  const signedAt =
    data.signedAt == null
      ? null
      : data.signedAt instanceof Date
        ? data.signedAt
        : new Date(data.signedAt);

  const assetChecks = (data.assetChecks ?? []).map((check) => ({
    ...check,
    servicedAt:
      check.servicedAt == null
        ? null
        : check.servicedAt instanceof Date
          ? check.servicedAt
          : new Date(check.servicedAt),
  }));

  return {
    ...data,
    scheduledAt,
    completedAt,
    signedAt,
    assetChecks,
  };
}

/** Keep RSC → client payloads small and JSON-safe. */
export function serializeInspectionForClient(
  inspection: InspectionFormData,
): ClientInspectionFormData {
  return {
    ...inspection,
    scheduledAt: inspection.scheduledAt.toISOString(),
    completedAt: inspection.completedAt?.toISOString() ?? null,
    signedAt: inspection.signedAt?.toISOString() ?? null,
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
    assetChecks: inspection.assetChecks.map((check) => ({
      ...check,
      servicedAt: check.servicedAt?.toISOString() ?? null,
    })),
  };
}
