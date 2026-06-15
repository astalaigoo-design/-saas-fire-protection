/**
 * Test Prisma against DATABASE_URL from current env (use with vercel env run).
 * Usage: npx vercel env run --environment production -- node scripts/test-prisma-env.mjs
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.log(JSON.stringify({ ok: false, error: "DATABASE_URL not set" }));
  process.exit(1);
}

let host = "?";
try {
  const parsed = new URL(url);
  host = `${parsed.hostname}:${parsed.port || "5432"}`;
} catch {
  /* ignore */
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log(JSON.stringify({ ok: true, host }));
} catch (error) {
  const err = error;
  console.log(
    JSON.stringify({
      ok: false,
      host,
      name: err?.name ?? "Error",
      code: err?.code ?? null,
      error: err?.message?.slice(0, 300) ?? String(error),
    }),
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
