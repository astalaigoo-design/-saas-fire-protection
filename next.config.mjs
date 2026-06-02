import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid blocking deploys on lint warnings (e.g. react-pdf Image alt).
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    instrumentationHook: true,
  },
};

const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default withSentryConfig(nextConfig, {
  org: sentryOrg,
  project: sentryProject,
  authToken: sentryAuthToken,

  // Upload source maps when SENTRY_AUTH_TOKEN is set (CI / Vercel).
  silent: !process.env.CI && !sentryAuthToken,

  // Tunnel browser events through the app (ad-blocker friendly).
  tunnelRoute: "/monitoring",

  hideSourceMaps: true,
  widenClientFileUpload: true,

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Do not fail production builds when Sentry upload is not configured yet.
  sourcemaps: {
    disable: !sentryAuthToken,
  },
});
