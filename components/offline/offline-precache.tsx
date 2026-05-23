"use client";

import { useEffect } from "react";
import { cacheOfflineInspectShell } from "@/lib/offline/cache-page";
import { warmOfflineInspectStack } from "@/lib/offline/warm-cache";

/** Warm caches for offline field use while the user has connectivity. */
export function OfflinePrecache() {
  useEffect(() => {
    if (!navigator.onLine) return;

    cacheOfflineInspectShell();

    void warmOfflineInspectStack().catch(() => undefined);
  }, []);

  return null;
}
