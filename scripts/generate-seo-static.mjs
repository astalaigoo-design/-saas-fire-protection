/**
 * Writes public/robots.txt and public/sitemap.xml (no tsx required on Vercel build).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_SITEMAP_PATHS = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/sign-in", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sign-up", priority: 0.8, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" },
  { path: "/refund", priority: 0.4, changeFrequency: "yearly" },
  { path: "/refunds", priority: 0.4, changeFrequency: "yearly" },
];

const ROBOTS_DISALLOW_PREFIXES = [
  "/dashboard",
  "/inspect",
  "/api",
  "/r/",
  "/q/",
  "/marketing-screenshot/",
];

function getAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRobotsTxt(origin) {
  return [
    "User-agent: *",
    "Allow: /",
    ...ROBOTS_DISALLOW_PREFIXES.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

function buildSitemapXml(origin) {
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
    : process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ||
      "https://getflareflow.com";

writeFileSync(join(publicDir, "robots.txt"), buildRobotsTxt(origin), "utf8");
writeFileSync(join(publicDir, "sitemap.xml"), buildSitemapXml(origin), "utf8");

console.log("Generated public/robots.txt and public/sitemap.xml for", origin);
