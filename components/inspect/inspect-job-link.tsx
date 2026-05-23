"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useSyncExternalStore } from "react";
import { hardNavigate } from "@/lib/offline/hard-navigate";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";

type InspectJobLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  inspectionId: string;
};

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function InspectJobLink({ inspectionId, children, onClick, ...props }: InspectJobLinkProps) {
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot);
  const onlineHref = `/inspect/${inspectionId}`;
  const offlineHref = inspectOfflineHref(inspectionId);
  const href = online ? onlineHref : offlineHref;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (!online) {
      event.preventDefault();
      hardNavigate(offlineHref);
    }
  };

  return (
    <Link href={href} onClick={handleClick} prefetch={online} {...props}>
      {children}
    </Link>
  );
}
