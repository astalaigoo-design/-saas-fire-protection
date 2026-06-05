import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPilotReadinessStatus,
  isProductionDeployment,
  needsPilotReadinessAttention,
} from "@/lib/pilot-readiness/status";

vi.mock("@/lib/pilot-readiness/schema-probe", () => ({
  probePilotDatabaseSchema: vi.fn(async () => ({ ready: true, missing: [] })),
}));

describe("pilot readiness status", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
    vi.unstubAllEnvs();
  });

  it("flags attention when Resend is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.RESEND_API_KEY;
    delete process.env.REPORT_EMAIL_FROM;
    process.env.CRON_SECRET = "secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    const status = await getPilotReadinessStatus();
    expect(status.ready).toBe(false);
    expect(needsPilotReadinessAttention(status)).toBe(true);
    expect(status.items.find((item) => item.id === "resend")?.configured).toBe(false);
  });

  it("is ready when required production env is set", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    process.env.RESEND_API_KEY = "re_test";
    process.env.REPORT_EMAIL_FROM = "reports@getflareflow.com";
    process.env.CRON_SECRET = "cron-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    const status = await getPilotReadinessStatus();
    expect(status.ready).toBe(true);
    expect(needsPilotReadinessAttention(status)).toBe(false);
  });

  it("does not require CRON_SECRET outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.VERCEL_ENV;
    delete process.env.CRON_SECRET;
    process.env.RESEND_API_KEY = "re_test";
    process.env.REPORT_EMAIL_FROM = "reports@getflareflow.com";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    const status = await getPilotReadinessStatus();
    const cronItem = status.items.find((item) => item.id === "cron_secret");
    expect(cronItem?.required).toBe(false);
    expect(status.ready).toBe(true);
  });

  it("detects production deployment", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isProductionDeployment()).toBe(true);
  });
});
