import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";

type PublicSitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

/** Indexable marketing and legal pages only — no dashboard, tokens, or noindex routes. */
const PUBLIC_PAGES: PublicSitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/nfpa-25-inspection-software", changeFrequency: "monthly", priority: 0.7 },
  { path: "/fire-sprinkler-inspection-app", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sign-in", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sign-up", changeFrequency: "monthly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
  { path: "/refund", changeFrequency: "yearly", priority: 0.4 },
  { path: "/refunds", changeFrequency: "yearly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppOrigin();
  const lastModified = new Date();

  return PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? baseUrl : `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
