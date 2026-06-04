const PLACEHOLDER_FRAGMENTS = ["[PROJECT-REF]", "[YOUR-PASSWORD]", "[REGION]", "REPLACE_ME"];

/** Hostnames that are never valid (leftover placeholders). */
const INVALID_HOSTS = new Set(["x"]);

/** Not valid on Vercel/serverless — use Supabase pooler in deployed envs. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** Strip wrapping quotes / newlines from Vercel env paste mistakes. */
function normalizeEnvUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let value = raw.trim().replace(/\r?\n/g, "");
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value.length > 0 ? value : undefined;
}

export function assertValidDatabaseUrl(
  raw: string | undefined,
  label = "DATABASE_URL",
): string {
  const primary = normalizeEnvUrl(raw);
  const fallback =
    label === "DIRECT_URL"
      ? normalizeEnvUrl(process.env.DATABASE_URL)
      : normalizeEnvUrl(process.env.DIRECT_URL);
  const value = primary || fallback;

  if (!value) {
    throw new Error(
      `${label} is not set. Add DATABASE_URL and DIRECT_URL to .env or Vercel Environment Variables.`,
    );
  }

  for (const fragment of PLACEHOLDER_FRAGMENTS) {
    if (value.includes(fragment)) {
      throw new Error(
        `${label} still contains a placeholder (${fragment}). Copy the real URI from Supabase → Connect → ORMs.`,
      );
    }
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${label} is not a valid URL. In Vercel, paste the Supabase URI with no surrounding quotes. ` +
        `If the password contains @, #, or %, URL-encode it.`,
    );
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(`${label} must use the postgresql:// scheme.`);
  }

  const host = url.hostname.toLowerCase();
  if (!host || INVALID_HOSTS.has(host)) {
    throw new Error(
      `${label} hostname is "${url.hostname}" — that is not a real database host. ` +
        `Set a Supabase pooler URL from the dashboard (e.g. aws-1-us-east-1.pooler.supabase.com). ` +
        `See README.md → "Can't reach database server".`,
    );
  }

  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel && LOCAL_HOSTS.has(host)) {
    throw new Error(
      `${label} points to ${url.hostname}, which does not work on Vercel. ` +
        `Use your Supabase Transaction pooler URL (port 6543) in Vercel Environment Variables.`,
    );
  }

  return value;
}

/** Dev-only: bump connection_limit when Supabase pooler is set to 1. */
export function resolveDatabaseUrlForPrisma(): string {
  const rawDatabaseUrl = normalizeEnvUrl(process.env.DATABASE_URL);
  const rawDirectUrl = normalizeEnvUrl(process.env.DIRECT_URL);
  const validated = assertValidDatabaseUrl(rawDatabaseUrl || rawDirectUrl, "DATABASE_URL");

  if (process.env.NODE_ENV === "production") {
    return validated;
  }

  try {
    const url = new URL(validated);
    if (url.searchParams.get("connection_limit") === "1") {
      url.searchParams.set("connection_limit", "5");
      url.searchParams.set("pool_timeout", "20");
      return url.toString();
    }
  } catch {
    return validated;
  }

  return validated;
}
