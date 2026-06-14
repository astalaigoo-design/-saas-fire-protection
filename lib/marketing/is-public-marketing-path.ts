import { SEO_LANDING_PATHS } from "@/lib/seo/landing-pages";

/** Public marketing/legal routes — skip PWA precache and heavy app shell JS. */
export const PUBLIC_MARKETING_PATHS = [
  "/",
  "/pricing",
  "/about",
  "/compare",
  "/design-partner",
  "/sign-in",
  "/sign-up",
  "/terms",
  "/privacy",
  "/refund",
  "/refunds",
  ...SEO_LANDING_PATHS,
] as const;

export function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_MARKETING_PATHS.some(
    (path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
}
