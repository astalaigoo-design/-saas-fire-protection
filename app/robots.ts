import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";
import { ROBOTS_DISALLOW_PREFIXES } from "@/lib/seo/public-routes";

export default function robots(): MetadataRoute.Robots {
  const origin = getAppOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PREFIXES],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
