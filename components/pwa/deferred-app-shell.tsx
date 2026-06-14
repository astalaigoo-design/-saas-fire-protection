"use client";

import { usePathname } from "next/navigation";
import { ChunkErrorRecovery } from "@/components/pwa/chunk-error-recovery";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { OfflinePrecache } from "@/components/offline/offline-precache";
import { isPublicMarketingPath } from "@/lib/marketing/is-public-marketing-path";

/**
 * PWA + offline precache only on app routes (dashboard, inspect).
 * Marketing pages skip this JS for faster mobile LCP and lower TBT.
 */
export function DeferredAppShell() {
  const pathname = usePathname() ?? "/";

  if (isPublicMarketingPath(pathname)) {
    return null;
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <ChunkErrorRecovery />
      <OfflinePrecache />
    </>
  );
}
