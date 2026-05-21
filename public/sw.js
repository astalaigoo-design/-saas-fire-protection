const STATIC_CACHE = "flareflow-static-v7";
const PAGE_CACHE = "flareflow-pages-v7";
const INSPECT_CACHE = "flareflow-inspect-v7";

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname.startsWith("/inspect") && request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, INSPECT_CACHE).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response("Offline - open this inspection once while online.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response("Offline - this page is not cached yet.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});
