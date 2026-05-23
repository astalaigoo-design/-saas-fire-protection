"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js?v=16";
const SW_MIGRATION_KEY = "flareflow-sw-migrated-v16";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      const hasMigrated = window.localStorage.getItem(SW_MIGRATION_KEY) === "1";
      if (!hasMigrated) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));

        window.localStorage.setItem(SW_MIGRATION_KEY, "1");
      }

      await navigator.serviceWorker.register(SW_URL, {
        updateViaCache: "none",
      });
    };

    void register().catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
