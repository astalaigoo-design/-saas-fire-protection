import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return <LandingPage />;
}
