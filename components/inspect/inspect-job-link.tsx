"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";

type InspectJobLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  inspectionId: string;
};

export function InspectJobLink({ inspectionId, children, ...props }: InspectJobLinkProps) {
  return (
    <Link href={inspectOfflineHref(inspectionId)} {...props}>
      {children}
    </Link>
  );
}
