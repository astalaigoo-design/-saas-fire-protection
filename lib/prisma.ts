import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Supabase transaction pooler URLs often use connection_limit=1 for serverless.
 * Next.js dev issues many parallel queries per page — that exhausts a pool of 1.
 */
function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw || process.env.NODE_ENV === "production") return raw;

  try {
    const url = new URL(raw);
    const limit = url.searchParams.get("connection_limit");
    if (limit === "1") {
      url.searchParams.set("connection_limit", "5");
      url.searchParams.set("pool_timeout", "20");
      return url.toString();
    }
  } catch {
    return raw;
  }

  return raw;
}

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
