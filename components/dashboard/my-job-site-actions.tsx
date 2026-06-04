"use client";

import { useState } from "react";
import { buildMapsSearchUrl } from "@/lib/maps/build-search-url";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MyJobSiteActionsProps = {
  mapsQuery?: string;
  addressLine?: string;
  /** Omit card footer border (e.g. continue hero). */
  compact?: boolean;
};

export function MyJobSiteActions({
  mapsQuery,
  addressLine,
  compact = false,
}: MyJobSiteActionsProps) {
  const [copied, setCopied] = useState(false);
  const query = mapsQuery?.trim() || addressLine?.trim() || "";
  if (!query) return null;

  const mapsUrl = buildMapsSearchUrl(query);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        compact ? "mt-0 px-0 pb-0 pt-0" : "border-t border-border/60 px-4 pb-4 pt-3",
      )}
    >
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
      >
        Directions
      </a>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10")}
        onClick={() => void copyAddress()}
      >
        {copied ? "Copied" : "Copy address"}
      </button>
    </div>
  );
}
