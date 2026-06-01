import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { FIRE_SPRINKLER_INSPECTION_APP } from "@/lib/seo/landing-pages";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

const config = FIRE_SPRINKLER_INSPECTION_APP;

export const metadata: Metadata = buildPublicPageMetadata({
  title: config.title,
  description: config.description,
  path: config.path,
});

export default function FireSprinklerInspectionAppPage() {
  return <SeoLandingPage config={config} />;
}
