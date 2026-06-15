import { NextResponse } from "next/server";
import { assertValidDatabaseUrl, resolveDatabaseUrlForPrisma } from "@/lib/database/connection-url";
import { prisma } from "@/lib/prisma";
import { isCronAuthorized } from "@/lib/cron/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeUrlMeta(raw: string | undefined): {
  set: boolean;
  length: number;
  host: string | null;
  port: string | null;
  user: string | null;
  pgbouncer: string | null;
} {
  if (!raw?.trim()) {
    return { set: false, length: 0, host: null, port: null, user: null, pgbouncer: null };
  }
  try {
    const url = new URL(raw.trim());
    return {
      set: true,
      length: raw.trim().length,
      host: url.hostname,
      port: url.port || "5432",
      user: url.username || null,
      pgbouncer: url.searchParams.get("pgbouncer"),
    };
  } catch {
    return { set: true, length: raw.trim().length, host: null, port: null, user: null, pgbouncer: null };
  }
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const databaseUrlRaw = process.env.DATABASE_URL;
  const directUrlRaw = process.env.DIRECT_URL;

  let validateError: string | null = null;
  try {
    assertValidDatabaseUrl(databaseUrlRaw || directUrlRaw, "DATABASE_URL");
  } catch (error) {
    validateError = error instanceof Error ? error.message.slice(0, 300) : String(error);
  }

  let queryOk = false;
  let queryError: string | null = null;
  try {
    resolveDatabaseUrlForPrisma();
    await prisma.$queryRaw`SELECT 1 AS ok`;
    queryOk = true;
  } catch (error) {
    queryError = error instanceof Error ? error.message.slice(0, 400) : String(error);
  }

  return NextResponse.json({
    ok: !validateError && queryOk,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    databaseUrl: safeUrlMeta(databaseUrlRaw),
    directUrl: safeUrlMeta(directUrlRaw),
    validateError,
    queryOk,
    queryError,
  });
}
