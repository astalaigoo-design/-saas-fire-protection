export const OFFLINE_INSPECT_SHELL_PATH = "/inspect/offline";

export function cachePageForOffline(url: string): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: "CACHE_URL", url });
}

/** One shared HTML shell works for every inspection; data comes from IndexedDB. */
export function cacheOfflineInspectShell(): void {
  if (typeof window === "undefined") return;
  cachePageForOffline(`${window.location.origin}${OFFLINE_INSPECT_SHELL_PATH}`);
}

export function cacheInspectionForOffline(inspectionId: string): void {
  cacheOfflineInspectShell();
}
