import { hydrateInspectionFormData } from "@/lib/inspect/serialize-for-client";
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
  if (value.assetChecks !== undefined && !Array.isArray(value.assetChecks)) return false;
  if (!isRecord(value.building)) return false;
  if (!isRecord(value.inspectionType)) return false;
  return typeof value.inspectionType.name === "string";
}

export function parseInspectionSnapshot(snapshot: unknown): InspectionFormData | null {
  if (!isInspectionFormData(snapshot)) return null;
  return hydrateInspectionFormData(snapshot);
}

function mergeAssetChecks(
  server: InspectionFormData["assetChecks"],
  cached: InspectionFormData["assetChecks"],
): InspectionFormData["assetChecks"] {
  if (!cached.length) return server;
  const byId = new Map(server.map((row) => [row.id, row]));
  for (const cachedRow of cached) {
    const serverRow = byId.get(cachedRow.id);
    if (serverRow) {
      byId.set(cachedRow.id, {
        ...serverRow,
        result: cachedRow.result,
        notes: cachedRow.notes,
        servicedAt: cachedRow.servicedAt,
      });
    } else {
      byId.set(cachedRow.id, cachedRow);
    }
  }
  return Array.from(byId.values());
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
    assetChecks: mergeAssetChecks(server.assetChecks, cached.assetChecks),
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
