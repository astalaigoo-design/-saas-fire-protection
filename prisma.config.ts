import "dotenv/config";
import { defineConfig } from "prisma/config";

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
    // Use process.env (not env()) so `prisma generate` works when only DATABASE_URL is set.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
