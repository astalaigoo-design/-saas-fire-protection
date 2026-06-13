"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js?v=17";
const SW_MIGRATION_KEY = "flareflow-sw-migrated-v17";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      const hasMigrated = window.localStorage.getItem(SW_MIGRATION_KEY) === "1";

      if (!hasMigrated) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));

        window.localStorage.setItem(SW_MIGRATION_KEY, "1");
      }

      const registration = await navigator.serviceWorker.register(SW_URL, {
        updateViaCache: "none",
      });

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    };

    void register().catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
