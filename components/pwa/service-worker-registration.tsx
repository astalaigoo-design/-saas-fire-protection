"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js?v=4";
const SW_MIGRATION_KEY = "sw-migration-v4-done";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      if (!localStorage.getItem(SW_MIGRATION_KEY)) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));

        localStorage.setItem(SW_MIGRATION_KEY, "1");
      }

      const registration = await navigator.serviceWorker.register(SW_URL, {
        updateViaCache: "none",
      });

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => undefined);
      });

      await registration.update();
    };

    void register().catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
