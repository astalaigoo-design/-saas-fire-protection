import { createRequire } from "node:module";
import { defineConfig } from "prisma/config";

const require = createRequire(import.meta.url);
try {
  require("dotenv/config");
} catch {
  // Vercel / CI inject env; dotenv optional when not installed.
}

/**
 * Prisma CLI configuration (migrations, seed, studio).
 * Prisma 7 moves connection URLs here exclusively; on v6 this file removes
 * the package.json#prisma deprecation and prepares migrate deploy for v7.
 *
 * App runtime still uses DATABASE_URL (pooler) via lib/prisma.ts.
 * CLI/migrations use DIRECT_URL (session mode) — same as schema directUrl today.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Prefer DIRECT_URL for migrate deploy; fall back if unset or empty (Vercel placeholder).
    url:
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      "",
  },
});
