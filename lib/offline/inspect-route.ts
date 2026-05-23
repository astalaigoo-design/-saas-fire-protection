export function inspectOfflineHref(inspectionId: string): string {
  return `/inspect/offline?inspectionId=${encodeURIComponent(inspectionId)}`;
}

export function inspectHref(inspectionId: string): string {
  return inspectOfflineHref(inspectionId);
}
