"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "flareflow-chunk-reload-attempted";

function isChunkLoadFailure(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("loading chunk") ||
    normalized.includes("chunkloaderror") ||
    normalized.includes("failed to fetch dynamically imported module")
  );
}

/** After a deploy, stale cached HTML can reference removed webpack chunks — recover once. */
export function ChunkErrorRecovery() {
  useEffect(() => {
    const clearGuardTimer = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
    }, 15_000);

    const handleError = (event: ErrorEvent) => {
      const message = event.message ?? "";
      if (!isChunkLoadFailure(message)) return;
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;

      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");

      void (async () => {
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
          if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
          }
        } finally {
          window.location.reload();
        }
      })();
    };

    window.addEventListener("error", handleError);
    return () => {
      window.clearTimeout(clearGuardTimer);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
