import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppOrigin();
  const lastModified = new Date();

  return PUBLIC_SITEMAP_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${baseUrl}${path}` : baseUrl,
    lastModified,
    changeFrequency,
    priority,
  }));
}
