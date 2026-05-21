"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js?v=3";
const SW_MIGRATION_KEY = "flareflow-sw-migrated-v3";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let didRefresh = false;
    const onControllerChange = () => {
      if (didRefresh) return;
      didRefresh = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      const hasMigrated = window.localStorage.getItem(SW_MIGRATION_KEY) === "1";
      if (!hasMigrated) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith("flareflow-"))
            .map((key) => caches.delete(key)),
        );

        window.localStorage.setItem(SW_MIGRATION_KEY, "1");
      }

      const registration = await navigator.serviceWorker.register(SW_URL, {
        updateViaCache: "none",
      });

      const maybeActivateWaiting = () => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      };

      maybeActivateWaiting();
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") {
            maybeActivateWaiting();
          }
        });
      });

      await registration.update();
    };

    void register().catch((error) => {
      console.error("Service worker registration failed", error);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
