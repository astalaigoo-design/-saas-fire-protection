"use client";

import { PartsCatalog } from "@/components/parts/parts-catalog";
import type { ClientPartRow } from "@/lib/parts/types";

type PartsCatalogClientProps = {
  parts: ClientPartRow[];
};

/** Client boundary for parts catalog — server page must not use dynamic(ssr:false). */
export function PartsCatalogClient({ parts }: PartsCatalogClientProps) {
  return <PartsCatalog parts={parts} />;
}
