const STATIC_CACHE = "flareflow-static-v9";
const PAGE_CACHE = "flareflow-pages-v9";
const INSPECT_CACHE = "flareflow-inspect-v9";

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
              key !== STATIC_CACHE && key !== PAGE_CACHE && key !== INSPECT_CACHE,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_URL" && typeof event.data.url === "string") {
    event.waitUntil(
      caches.open(INSPECT_CACHE).then((cache) => cache.add(event.data.url).catch(() => undefined)),
    );
  }
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (request.method === "GET" && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  const networkResponse = await networkPromise;
  return (
    cached ||
    networkResponse ||
    new Response("", {
      status: 503,
      statusText: "Offline resource unavailable",
    })
  );
}

async function offlineInspectFallback(request, url) {
  const inspectionId = getInspectionIdFromPath(url.pathname);
  if (!inspectionId) return null;

  const offlineUrl = new URL("/inspect/offline", url.origin);
  offlineUrl.searchParams.set("inspectionId", inspectionId);

  const cachedOffline =
    (await caches.match(offlineUrl.href)) ||
    (await caches.match(`${url.origin}/inspect/offline`));

  if (cachedOffline) {
    return Response.redirect(offlineUrl.href, 302);
  }

  return null;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    (url.pathname.startsWith("/inspect/") || url.pathname === "/inspect/offline") &&
    request.mode === "navigate"
  ) {
    event.respondWith(
      networkFirst(request, INSPECT_CACHE).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const fallback = await offlineInspectFallback(request, url);
        if (fallback) return fallback;

        return new Response(
          "Offline — open this inspection once while online, then use Resume on My Jobs.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          },
        );
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
          "Offline — open My Jobs once while online, then use Resume inspection.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          },
        );
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});
