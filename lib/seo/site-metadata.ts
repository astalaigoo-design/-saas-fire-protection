import type { Metadata } from "next";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
} from "@/lib/branding";
import { getAppOrigin } from "@/lib/app-url";

const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${APP_NAME} — ${APP_TAGLINE}`,
} as const;

export function getMetadataBase(): URL {
  return new URL(getAppOrigin());
}

export function buildRootMetadata(): Metadata {
  const title = `${APP_NAME} — ${APP_TAGLINE}`;

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: title,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    manifest: "/manifest.webmanifest",
    themeColor: "#020617",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: APP_NAME,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: APP_NAME,
      title,
      description: APP_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: APP_DESCRIPTION,
      images: ["/twitter-image"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildPublicPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const canonical = input.path ? input.path : "/";

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      title: input.title,
      description: input.description,
      images: ["/twitter-image"],
    },
  };
}

/** Authenticated app surfaces should not be indexed. */
export const DASHBOARD_ROBOTS_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
