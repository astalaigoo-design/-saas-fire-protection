import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveDatabaseUrlForPrisma } from "@/lib/database/connection-url";

const POOLER_URL =
  "postgresql://postgres.test:secret@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

describe("resolveDatabaseUrlForPrisma", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds serverless pooler params on Vercel production", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", POOLER_URL);

    const resolved = resolveDatabaseUrlForPrisma();
    const url = new URL(resolved);

    expect(url.searchParams.get("pgbouncer")).toBe("true");
    expect(url.searchParams.get("connection_limit")).toBe("1");
    expect(url.searchParams.get("pool_timeout")).toBe("20");
    expect(url.searchParams.get("sslmode")).toBe("require");
  });

  it("bumps connection_limit for local dev when pooler limit is 1", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres.test:secret@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
    );

    const resolved = resolveDatabaseUrlForPrisma();
    const url = new URL(resolved);

    expect(url.searchParams.get("connection_limit")).toBe("5");
    expect(url.searchParams.get("pool_timeout")).toBe("20");
  });
});
