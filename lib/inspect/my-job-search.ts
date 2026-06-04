import type { JobCatalogEntry } from "@/lib/offline/job-catalog";

export function matchesMyJobSearch(job: JobCatalogEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    job.label,
    job.subtitle,
    job.addressLine ?? "",
    job.mapsQuery ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}
