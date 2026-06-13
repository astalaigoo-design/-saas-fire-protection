/** Marketing and legal paths included in sitemap.xml (no auth required). */
export const PUBLIC_SITEMAP_PATHS = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  {
    path: "/nfpa-25-inspection-software",
    priority: 0.7,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/fire-sprinkler-inspection-app",
    priority: 0.7,
    changeFrequency: "monthly" as const,
  },
  { path: "/sign-in", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/sign-up", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/refund", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/refunds", priority: 0.4, changeFrequency: "yearly" as const },
];

/** Paths blocked in robots.txt (app, API, shared report tokens). */
export const ROBOTS_DISALLOW_PREFIXES = [
  "/dashboard",
  "/inspect",
  "/api",
  "/r/",
  "/q/",
  "/marketing-screenshot/",
] as const;
