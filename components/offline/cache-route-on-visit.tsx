"use client";

import { useEffect } from "react";
import { cacheOfflineInspectShell, cachePageForOffline } from "@/lib/offline/cache-page";
import { warmUrlForOffline } from "@/lib/offline/warm-cache";

type CacheRouteOnVisitProps = {
  path: string;
};

export function CacheRouteOnVisit({ path }: CacheRouteOnVisitProps) {
  useEffect(() => {
    if (!navigator.onLine) return;
    cachePageForOffline(`${window.location.origin}${path}`);
    cacheOfflineInspectShell();
    void warmUrlForOffline(path);
  }, [path]);

  return null;
}
