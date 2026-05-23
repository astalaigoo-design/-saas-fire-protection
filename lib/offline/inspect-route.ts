export function inspectOfflineHref(inspectionId: string): string {
  return `/inspect/offline?inspectionId=${encodeURIComponent(inspectionId)}`;
}

export function inspectHref(inspectionId: string): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return inspectOfflineHref(inspectionId);
  }
  return `/inspect/${inspectionId}`;
}
