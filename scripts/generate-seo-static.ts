/**
 * Writes public/robots.txt and public/sitemap.xml for crawlers.
 * Run before build (Vercel) or after changing lib/seo/public-routes.ts.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAppOrigin } from "../lib/app-url";
import {
  PUBLIC_SITEMAP_PATHS,
  ROBOTS_DISALLOW_PREFIXES,
} from "../lib/seo/public-routes";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRobotsTxt(origin: string): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...ROBOTS_DISALLOW_PREFIXES.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ];
  return lines.join("\n");
}

function buildSitemapXml(origin: string): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_SITEMAP_PATHS.map(({ path, priority, changeFrequency }) => {
    const loc = path ? `${origin}${path}` : origin;
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changeFrequency}</changefreq>`,
      `    <priority>${priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

const publicDir = join(process.cwd(), "public");
const origin =
  process.env.NODE_ENV === "production"
    ? getAppOrigin()
    : process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") || "https://getflareflow.com";

writeFileSync(join(publicDir, "robots.txt"), buildRobotsTxt(origin), "utf8");
writeFileSync(join(publicDir, "sitemap.xml"), buildSitemapXml(origin), "utf8");

console.log("Generated public/robots.txt and public/sitemap.xml for", origin);
