"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { hardNavigate, shouldHardNavigateOffline } from "@/lib/offline/hard-navigate";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";

type InspectJobLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  inspectionId: string;
};

export function InspectJobLink({ inspectionId, children, onClick, ...props }: InspectJobLinkProps) {
  const href = inspectOfflineHref(inspectionId);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (shouldHardNavigateOffline()) {
      event.preventDefault();
      hardNavigate(href);
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
