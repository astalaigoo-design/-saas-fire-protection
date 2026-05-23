const STATIC_CACHE = "flareflow-static-v14";
const INSPECT_SHELL_CACHE = "flareflow-inspect-shell-v14";
const ASSET_CACHE = "flareflow-assets-v14";

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

const OFFLINE_SHELL_PATH = "/inspect/offline";

function getInspectionIdFromPath(pathname) {
  const match = pathname.match(/^\/inspect\/([^/]+)$/);
  if (!match) return null;
  const id = match[1];
  if (id === "offline") return null;
  return id;
}

async function cachePutSafe(cache, request, response) {
  if (!response?.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    /* quota */
  }
}

async function matchOfflineShell() {
  const cache = await caches.open(INSPECT_SHELL_CACHE);
  for (const req of await cache.keys()) {
    if (new URL(req.url).pathname === OFFLINE_SHELL_PATH) {
      const hit = await cache.match(req);
      if (hit) return hit;
    }
  }
  return null;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await cachePutSafe(cache, request, response);
  return response;
}

async function networkFirstStatic(request) {
  const cache = await caches.open(ASSET_CACHE);

  if (self.navigator.onLine) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cachePutSafe(cache, request, response);
        return response;
      }
    } catch {
      /* cache */
    }
  }

  const cached = await cache.match(request);
  if (cached) return cached;

  return fetch(request);
}

async function handleInspectNavigate(request, url) {
  const shellCache = await caches.open(INSPECT_SHELL_CACHE);
  const inspectionId =
    getInspectionIdFromPath(url.pathname) || url.searchParams.get("inspectionId");

  if (!self.navigator.onLine) {
    if (url.pathname === OFFLINE_SHELL_PATH) {
      const shell = await matchOfflineShell();
      if (shell) return shell;
      const cached = await shellCache.match(request);
      if (cached) return cached;
    }

    if (inspectionId) {
      const offlineUrl = new URL(OFFLINE_SHELL_PATH, url.origin);
      offlineUrl.searchParams.set("inspectionId", inspectionId);
      if (request.url !== offlineUrl.href) {
        return Response.redirect(offlineUrl.href, 302);
      }
      const shell = await matchOfflineShell();
      if (shell) return shell;
    }

    throw new Error("offline");
  }

  try {
    const response = await fetch(request);
    if (response.ok && url.pathname === OFFLINE_SHELL_PATH) {
      await cachePutSafe(shellCache, request, response);
    }
    return response;
  } catch {
    if (url.pathname === OFFLINE_SHELL_PATH) {
      const shell = await matchOfflineShell();
      if (shell) return shell;
    }
    throw new Error("offline");
  }
}

async function cacheUrlMessage(urlString) {
  const request = new Request(urlString, { credentials: "include" });
  const response = await fetch(request);
  if (!response.ok) return;

  const url = new URL(urlString);
  if (url.pathname === OFFLINE_SHELL_PATH || url.pathname.startsWith("/inspect")) {
    const cache = await caches.open(INSPECT_SHELL_CACHE);
    await cachePutSafe(cache, request, response);
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
              key !== STATIC_CACHE && key !== INSPECT_SHELL_CACHE && key !== ASSET_CACHE,
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
      networkFirstStatic(request).catch(
        () =>
          new Response("Offline — connect once to download the app.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
    return;
  }

  if (
    request.mode === "navigate" &&
    (url.pathname === OFFLINE_SHELL_PATH || url.pathname.startsWith("/inspect/"))
  ) {
    event.respondWith(
      handleInspectNavigate(request, url).catch(
        () =>
          new Response(
            "Offline — open My Jobs while online and tap each job once before going offline.",
            { status: 503, headers: { "Content-Type": "text/plain" } },
          ),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});
