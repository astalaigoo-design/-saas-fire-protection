export function cachePageForOffline(url: string): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: "CACHE_URL", url });
}

export function cacheInspectionForOffline(inspectionId: string): void {
  if (typeof window === "undefined") return;
  const origin = window.location.origin;
  cachePageForOffline(`${origin}/inspect/${inspectionId}`);
  cachePageForOffline(`${origin}/inspect/offline?inspectionId=${encodeURIComponent(inspectionId)}`);
}
