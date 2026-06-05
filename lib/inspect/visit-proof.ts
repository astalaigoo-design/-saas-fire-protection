import { z } from "zod";

export const gpsCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(50_000).optional(),
  capturedAt: z.string().datetime().optional(),
});

export type GpsCoordinatesInput = z.infer<typeof gpsCoordinatesSchema>;

export const recordVisitArrivalSchema = z.object({
  inspectionId: z.string().trim().min(1),
  coordinates: gpsCoordinatesSchema,
});

export const visitMileageSchema = z.number().min(0).max(9999).optional();

export type VisitProofSummary = {
  startedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  onSiteMinutes: number | null;
  mileageMiles: number | null;
  hasArrivalGps: boolean;
  hasSubmitGps: boolean;
  arrivalLatitude: number | null;
  arrivalLongitude: number | null;
  submitLatitude: number | null;
  submitLongitude: number | null;
};

export function buildVisitProofSummary(input: {
  startedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  mileageMiles: number | null;
  arrivalLatitude: number | null;
  arrivalLongitude: number | null;
  submitLatitude: number | null;
  submitLongitude: number | null;
}): VisitProofSummary {
  const anchorStart = input.arrivedAt ?? input.startedAt;
  const onSiteMinutes =
    anchorStart && input.completedAt
      ? Math.max(
          0,
          Math.round((input.completedAt.getTime() - anchorStart.getTime()) / 60_000),
        )
      : null;

  return {
    startedAt: input.startedAt,
    arrivedAt: input.arrivedAt,
    completedAt: input.completedAt,
    onSiteMinutes,
    mileageMiles: input.mileageMiles,
    hasArrivalGps: input.arrivalLatitude != null && input.arrivalLongitude != null,
    hasSubmitGps: input.submitLatitude != null && input.submitLongitude != null,
    arrivalLatitude: input.arrivalLatitude,
    arrivalLongitude: input.arrivalLongitude,
    submitLatitude: input.submitLatitude,
    submitLongitude: input.submitLongitude,
  };
}

export function googleMapsCoordsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function formatOnSiteDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}
