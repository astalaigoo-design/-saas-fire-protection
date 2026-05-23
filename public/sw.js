const STATIC_CACHE = "flareflow-static-v13";
const PAGE_CACHE = "flareflow-pages-v13";
const INSPECT_CACHE = "flareflow-inspect-v13";
const ASSET_CACHE = "flareflow-assets-v13";

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

function getInspectionIdFromPath(pathname) {
  const match = pathname.match(/^\/inspect\/([^/]+)$/);
  if (!match) return null;
  const id = match[1];
  if (id === "offline") return null;
  return id;
}

function isNextInternalRequest(url, request) {
  if (url.pathname.startsWith("/_next/")) return true;
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

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    await cachePutSafe(cache, request, response);
    return response;
  } catch {
    const fallback = await cache.match(request);
    if (fallback) return fallback;
    throw new Error("offline");
  }
}

/** Online: fresh HTML/chunks after deploy. Offline: cached shell. */
async function networkFirstNavigate(request, cacheName) {
  const cache = await caches.open(cacheName);

  if (self.navigator.onLine) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cachePutSafe(cache, request, response);
        const contentType = response.headers.get("Content-Type") ?? "";
        if (contentType.includes("text/html")) {
          const html = await response.clone().text();
          const assetCache = await caches.open(ASSET_CACHE);
          await warmAssetsFromHtml(html, new URL(request.url).origin, assetCache);
        }
        return response;
      }
    } catch {
      /* fall through to cache */
    }
  }

  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    await cachePutSafe(cache, request, response);
    return response;
  } catch {
    throw new Error("offline");
  }
}

async function networkFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);

  if (self.navigator.onLine) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cachePutSafe(cache, request, response);
        return response;
      }
    } catch {
      /* use cache */
    }
  }

  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    await cachePutSafe(cache, request, response);
    return response;
  } catch {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/_next/static/")) {
      const keys = await cache.keys();
      for (const key of keys) {
        if (new URL(key.url).pathname === url.pathname) {
          const hit = await cache.match(key);
          if (hit) return hit;
        }
      }
    }
    throw new Error("offline");
  }
}

async function networkFirstRsc(request) {
  const cache = await caches.open(ASSET_CACHE);

  if (self.navigator.onLine) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cachePutSafe(cache, request, response);
        return response;
      }
    } catch {
      /* use cache */
    }
  }

  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    await cachePutSafe(cache, request, response);
    return response;
  } catch {
    throw new Error("offline");
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

async function cacheUrlMessage(urlString) {
  const request = new Request(urlString, { credentials: "include" });
  const response = await fetch(request);
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
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

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      networkFirstAsset(request).catch(
        () =>
          new Response("Offline — open the app online once to download updates.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
    return;
  }

  if (isNextInternalRequest(url, request)) {
    event.respondWith(
      networkFirstRsc(request).catch(
        () =>
          new Response("Offline — reload after connecting once.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
    return;
  }

  if (
    (url.pathname.startsWith("/inspect/") || url.pathname === "/inspect/offline") &&
    request.mode === "navigate"
  ) {
    event.respondWith(
      networkFirstNavigate(request, INSPECT_CACHE).catch(async () => {
        const offline = await serveOfflineInspectionNavigate(request, url);
        if (offline) return offline;
        return new Response(
          "Offline — open My Jobs online, open each inspection once, then try again.",
          { status: 503, headers: { "Content-Type": "text/plain" } },
        );
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirstNavigate(request, PAGE_CACHE).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
          "Offline — open My Jobs once while online, then try again.",
          { status: 503, headers: { "Content-Type": "text/plain" } },
        );
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});
