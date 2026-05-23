import { cachePageForOffline } from "@/lib/offline/cache-page";

const NEXT_ASSET_RE = /(?:src|href)="(\/_next\/[^"?#]+)/g;
const IFRAME_WARM_MS = 4000;

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

function warmRouteInHiddenFrame(path: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.style.cssText =
      "position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none";
    iframe.src = path;

    const finish = () => {
      window.clearTimeout(timer);
      iframe.remove();
      resolve();
    };

    const timer = window.setTimeout(finish, IFRAME_WARM_MS);
    iframe.onload = () => {
      window.setTimeout(finish, 1500);
    };
    iframe.onerror = finish;

    document.body.appendChild(iframe);
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
  if (typeof window === "undefined" || !navigator.onLine) return;

  cachePageForOffline(`${window.location.origin}/offline.html`);
  await warmUrlForOffline("/dashboard/my-jobs");
  await warmUrlForOffline("/dashboard");
  await warmUrlForOffline("/inspect/offline");
  await warmRouteInHiddenFrame("/inspect/offline");
  await warmRouteInHiddenFrame("/dashboard/my-jobs");
}
