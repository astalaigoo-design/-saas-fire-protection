"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import {
  adjustPartStock,
  createPart,
  updatePart,
} from "@/lib/parts/actions";
import { logClientDebug } from "@/lib/debug/log-client-debug";
import type { ClientPartRow } from "@/lib/parts/types";

const PartsCatalog = dynamic(
  () => import("@/components/parts/parts-catalog").then((m) => m.PartsCatalog),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading parts catalog">
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    ),
  },
);

const catalogActions = {
  createPart,
  updatePart,
  adjustPartStock,
} as const;

type PartsCatalogClientProps = {
  parts: ClientPartRow[];
};

/** Client-only catalog — dynamic(ssr:false) must live in a Client Component. */
export function PartsCatalogClient({ parts }: PartsCatalogClientProps) {
  useEffect(() => {
    // #region agent log
    void logClientDebug({
      runId: "post-fix",
      hypothesisId: "I",
      location: "parts-catalog-client:mount",
      message: "PartsCatalogClient mounted",
      data: { partCount: parts.length },
    });
    // #endregion
  }, [parts.length]);

  return <PartsCatalog parts={parts} actions={catalogActions} />;
}
