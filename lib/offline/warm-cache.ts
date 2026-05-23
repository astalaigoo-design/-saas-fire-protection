import { cachePageForOffline } from "@/lib/offline/cache-page";

const NEXT_ASSET_RE = /(?:src|href)="(\/_next\/[^"?#]+)/g;

function extractNextAssetPaths(html: string): string[] {
  const paths = new Set<string>();
  let match = NEXT_ASSET_RE.exec(html);
  while (match) {
    paths.add(match[1]);
    match = NEXT_ASSET_RE.exec(html);
  }
  return Array.from(paths);
}

async function waitForServiceWorkerControl(timeoutMs = 8000): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  if (navigator.serviceWorker.controller) return true;

  await navigator.serviceWorker.ready;

  if (navigator.serviceWorker.controller) return true;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs);
    const onController = () => {
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      resolve(Boolean(navigator.serviceWorker.controller));
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
  });
}

/** Fetch a page and its Next.js chunks so the service worker can serve them offline. */
export async function warmUrlForOffline(path: string): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const hasControl = await waitForServiceWorkerControl();
  if (!hasControl) return;

  const origin = window.location.origin;
  const pageUrl = path.startsWith("http") ? path : `${origin}${path}`;

  try {
    const response = await fetch(pageUrl, { credentials: "include" });
    cachePageForOffline(pageUrl);
    if (!response.ok) return;

    const html = await response.text();
    const assets = extractNextAssetPaths(html);

    await Promise.allSettled(
      assets.map(async (assetPath) => {
        const assetUrl = `${origin}${assetPath}`;
        const assetResponse = await fetch(assetUrl, { credentials: "same-origin" });
        if (assetResponse.ok) cachePageForOffline(assetUrl);
      }),
    );
  } catch {
    /* network errors ignored */
  }
}

export async function warmOfflineInspectStack(): Promise<void> {
  await warmUrlForOffline("/inspect/offline");
  await warmUrlForOffline("/dashboard/my-jobs");
}
