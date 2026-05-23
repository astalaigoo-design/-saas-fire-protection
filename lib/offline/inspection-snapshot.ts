import type { InspectionFormData } from "@/lib/inspect/queries";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isInspectionFormData(value: unknown): value is InspectionFormData {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.status !== "string") return false;
  if (!Array.isArray(value.items)) return false;
  if (!Array.isArray(value.photos)) return false;
  if (!isRecord(value.building)) return false;
  if (!isRecord(value.inspectionType)) return false;
  return typeof value.inspectionType.name === "string";
}

function hydrateInspectionDates(snapshot: InspectionFormData): InspectionFormData {
  return {
    ...snapshot,
    scheduledAt: new Date(snapshot.scheduledAt),
    completedAt: snapshot.completedAt ? new Date(snapshot.completedAt) : null,
    signedAt: snapshot.signedAt ? new Date(snapshot.signedAt) : null,
  };
}

export function parseInspectionSnapshot(snapshot: unknown): InspectionFormData | null {
  if (!isInspectionFormData(snapshot)) return null;
  return hydrateInspectionDates(snapshot);
}

export function mergeInspectionWithCache(
  server: InspectionFormData,
  cached: InspectionFormData,
): InspectionFormData {
  return {
    ...server,
    status: cached.status !== "scheduled" ? cached.status : server.status,
    signatureData: cached.signatureData ?? server.signatureData,
    items: cached.items,
    photos: cached.photos,
  };
}

export function preferOfflineInspection(
  server: InspectionFormData | null,
  cached: InspectionFormData | null,
  offline: boolean,
): InspectionFormData | null {
  if (offline) return cached ?? server;
  if (server && cached) return mergeInspectionWithCache(server, cached);
  return server ?? cached;
}
