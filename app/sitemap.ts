import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getAppOrigin();
  const lastModified = new Date();

  return PUBLIC_SITEMAP_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: path ? `${origin}${path}` : origin,
    lastModified,
    changeFrequency,
    priority,
  }));
}
