export type JobCatalogEntry = {
  inspectionId: string;
  label: string;
  subtitle: string;
  scheduledAt: string;
  status?: "scheduled" | "in_progress";
  /** One-line site address for search and display. */
  addressLine?: string;
  /** Full query for maps directions. */
  mapsQuery?: string;
};

const JOB_CATALOG_KEY = "flareflow-job-catalog";

export function saveJobCatalog(entries: JobCatalogEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOB_CATALOG_KEY, JSON.stringify(entries));
}

export function getJobCatalog(): JobCatalogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(JOB_CATALOG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as JobCatalogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
