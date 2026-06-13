import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { FIRE_PROTECTION_REPAIR_QUOTING } from "@/lib/seo/landing-pages";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

const config = FIRE_PROTECTION_REPAIR_QUOTING;

export const metadata: Metadata = buildPublicPageMetadata({
  title: config.title,
  description: config.description,
  path: config.path,
});

export default function FireProtectionRepairQuotingPage() {
  return <SeoLandingPage config={config} />;
}
