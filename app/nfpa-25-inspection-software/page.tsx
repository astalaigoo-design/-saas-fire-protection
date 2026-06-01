import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { NFPA_25_INSPECTION_SOFTWARE } from "@/lib/seo/landing-pages";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

const config = NFPA_25_INSPECTION_SOFTWARE;

export const metadata: Metadata = buildPublicPageMetadata({
  title: config.title,
  description: config.description,
  path: config.path,
});

export default function Nfpa25InspectionSoftwarePage() {
  return <SeoLandingPage config={config} />;
}
