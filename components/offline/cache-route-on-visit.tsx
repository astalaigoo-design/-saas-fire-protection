"use client";

import { useEffect } from "react";
import { cachePageForOffline } from "@/lib/offline/cache-page";

type CacheRouteOnVisitProps = {
  path: string;
};

export function CacheRouteOnVisit({ path }: CacheRouteOnVisitProps) {
  useEffect(() => {
    if (!navigator.onLine) return;
    cachePageForOffline(`${window.location.origin}${path}`);
  }, [path]);

  return null;
}
