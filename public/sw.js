const STATIC_CACHE = "flareflow-static-v20";
const PAGE_CACHE = "flareflow-pages-v20";
const INSPECT_CACHE = "flareflow-inspect-v20";
const ASSET_CACHE = "flareflow-assets-v20";

const OFFLINE_FALLBACK_PATH = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_FALLBACK_PATH,
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/dashboard/my-jobs",
  "/inspect/offline",
];

const OFFLINE_NAV_FALLBACKS = [
  "/dashboard/my-jobs",
  "/inspect/offline",
  "/dashboard",
  OFFLINE_FALLBACK_PATH,
];

function getInspectionIdFromPath(pathname) {
  const match = pathname.match(/^\/inspect\/([^/]+)$/);
  if (!match) return null;
  const id = match[1];
  if (id === "offline") return null;
  return id;
}

function isRscRequest(request) {
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-Prefetch")) return true;
  if (request.headers.get("Next-Router-State-Tree")) return true;
  return false;
}

function extractNextAssetPaths(html) {
  const paths = new Set();
  const re = /(?:src|href)="(\/_next\/[^"?#]+)/g;
  let match = re.exec(html);
  while (match) {
    paths.add(match[1]);
    match = re.exec(html);
  }
  return Array.from(paths);
}

async function matchOfflineInspectShell() {
  const cache = await caches.open(INSPECT_CACHE);
  for (const req of await cache.keys()) {
    if (new URL(req.url).pathname === "/inspect/offline") {
      const hit = await cache.match(req);
      if (hit) return hit;
    }
  }
  return null;
}

async function cachePutSafe(cache, request, response) {
  if (!response || !response.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    /* quota or opaque response */
  }
}

async function warmAssetsFromHtml(html, origin, cache) {
  const paths = extractNextAssetPaths(html);
  await Promise.allSettled(
    paths.map(async (path) => {
      const assetUrl = `${origin}${path}`;
      const request = new Request(assetUrl, { credentials: "same-origin" });
      const existing = await cache.match(request);
      if (existing) return;
      try {
        const response = await fetch(request);
        await cachePutSafe(cache, request, response);
      } catch {
        /* ignore */
      }
    }),
  );
}

async function matchCachedByPathname(pathname) {
  const cacheNames = [PAGE_CACHE, INSPECT_CACHE, STATIC_CACHE, ASSET_CACHE];
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    for (const req of await cache.keys()) {
      if (new URL(req.url).pathname === pathname) {
        const hit = await cache.match(req);
        if (hit) return hit;
      }
    }
  }
  return caches.match(OFFLINE_FALLBACK_PATH);
}

/** Cache hashed JS/CSS for offline; always try network first when online. */
async function networkFirstStatic(request) {
  const cache = await caches.open(ASSET_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cachePutSafe(cache, request, response);
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const url = new URL(request.url);
    if (url.pathname.startsWith("/_next/static/")) {
      for (const req of await cache.keys()) {
        if (new URL(req.url).pathname === url.pathname) {
          const hit = await cache.match(req);
          if (hit) return hit;
        }
      }
    }
    throw new Error("asset-miss");
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const pathname = new URL(request.url).pathname;
  const byPath = await matchCachedByPathname(pathname);
  if (byPath) return byPath;

  try {
    const response = await fetch(request);
    if (response.ok) await cachePutSafe(cache, request, response);
    return response;
  } catch {
    const fallback = await cache.match(request);
    if (fallback) return fallback;
    throw new Error("offline-miss");
  }
}

async function serveOfflineInspectionNavigate(request, url) {
  const shell = await matchOfflineInspectShell();
  const inspectionId =
    getInspectionIdFromPath(url.pathname) || url.searchParams.get("inspectionId");

  if (url.pathname === "/inspect/offline") {
    if (shell) return shell;
    const cached = await caches.match(request);
    if (cached) return cached;
  }

  if (inspectionId && shell) {
    const offlineUrl = new URL("/inspect/offline", url.origin);
    offlineUrl.searchParams.set("inspectionId", inspectionId);
    if (request.url !== offlineUrl.href) {
      return Response.redirect(offlineUrl.href, 302);
    }
    return shell;
  }

  return null;
}

async function offlineNavigateResponse(request, url) {
  const isInspect =
    url.pathname.startsWith("/inspect/") || url.pathname === "/inspect/offline";
  const cacheName = isInspect ? INSPECT_CACHE : PAGE_CACHE;

  try {
    return await cacheFirstWithNetwork(request, cacheName);
  } catch {
    if (isInspect) {
      const offline = await serveOfflineInspectionNavigate(request, url);
      if (offline) return offline;
    }

    for (const path of OFFLINE_NAV_FALLBACKS) {
      if (path === url.pathname) {
        const hit = await matchCachedByPathname(path);
        if (hit) return hit;
      }
    }

    for (const path of OFFLINE_NAV_FALLBACKS) {
      if (path !== url.pathname) {
        const hit = await matchCachedByPathname(path);
        if (hit) {
          return Response.redirect(new URL(path, url.origin).href, 302);
        }
      }
    }

    const offlinePage = await matchCachedByPathname(OFFLINE_FALLBACK_PATH);
    if (offlinePage) return offlinePage;

    return (
      (await caches.match(OFFLINE_FALLBACK_PATH)) ??
      new Response("Offline — open the app online once, then try My Jobs again.", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function offlineRscOrAsset(request) {
  return cacheFirstWithNetwork(request, ASSET_CACHE).catch(() => fetch(request));
}

async function cacheUrlMessage(urlString) {
  const request = new Request(urlString, { credentials: "include" });
  let response;
  try {
    response = await fetch(request);
  } catch {
    return;
  }
  if (!response.ok) return;

  const url = new URL(urlString);
  const isInspect = url.pathname.startsWith("/inspect");
  const cacheName = isInspect ? INSPECT_CACHE : PAGE_CACHE;
  const cache = await caches.open(cacheName);
  await cachePutSafe(cache, request, response);

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("text/html")) {
    const html = await response.clone().text();
    const assetCache = await caches.open(ASSET_CACHE);
    await warmAssetsFromHtml(html, url.origin, assetCache);
  }
}

async function precacheCriticalPages() {
  const pageCache = await caches.open(PAGE_CACHE);
  const inspectCache = await caches.open(INSPECT_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);

  await staticCache.addAll([
    OFFLINE_FALLBACK_PATH,
    "/manifest.webmanifest",
    "/icons/icon-192.svg",
    "/icons/icon-512.svg",
  ]);

  await Promise.allSettled(
    PRECACHE_URLS.filter((path) => path !== OFFLINE_FALLBACK_PATH).map(async (path) => {
      const request = new Request(path, { credentials: "include" });
      try {
        const response = await fetch(request);
        if (!response.ok) return;
        const cache = path.startsWith("/inspect") ? inspectCache : pageCache;
        await cachePutSafe(cache, request, response);
        if (response.headers.get("Content-Type")?.includes("text/html")) {
          const html = await response.clone().text();
          const assetCache = await caches.open(ASSET_CACHE);
          await warmAssetsFromHtml(html, self.location.origin, assetCache);
        }
      } catch {
        /* offline install — skip */
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheCriticalPages());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE &&
              key !== PAGE_CACHE &&
              key !== INSPECT_CACHE &&
              key !== ASSET_CACHE,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "CACHE_URL" && typeof event.data.url === "string") {
    event.waitUntil(cacheUrlMessage(event.data.url).catch(() => undefined));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  const online = self.navigator.onLine;

  // Online: only cache immutable build chunks. Pages + RSC go to the network (fixes refresh).
  if (online) {
    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(
        networkFirstStatic(request).catch(() => fetch(request)),
      );
    }
    return;
  }

  // Offline handling below
  if (url.pathname.startsWith("/_next/static/") || isRscRequest(request)) {
    event.respondWith(offlineRscOrAsset(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      offlineNavigateResponse(request, url).then(
        (response) =>
          response ||
          matchCachedByPathname(OFFLINE_FALLBACK_PATH) ||
          caches.match(OFFLINE_FALLBACK_PATH),
      ),
    );
    return;
  }

  if (url.pathname === OFFLINE_FALLBACK_PATH || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      cacheFirstWithNetwork(request, STATIC_CACHE).catch(() =>
        caches.match(OFFLINE_FALLBACK_PATH),
      ),
    );
  }
});
