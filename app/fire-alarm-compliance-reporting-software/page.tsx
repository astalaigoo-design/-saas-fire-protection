import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { FIRE_ALARM_COMPLIANCE_REPORTING } from "@/lib/seo/landing-pages";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

const config = FIRE_ALARM_COMPLIANCE_REPORTING;

export const metadata: Metadata = buildPublicPageMetadata({
  title: config.title,
  description: config.description,
  path: config.path,
});

export default function FireAlarmComplianceReportingPage() {
  return <SeoLandingPage config={config} />;
}
