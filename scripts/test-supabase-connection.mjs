/**
 * Verifies Supabase credentials from .env (run: npm run db:test).
 * 28P01 / Prisma P1000 → wrong database password; reset in Supabase Dashboard.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

function loadEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function parsePoolerUser(connectionString) {
  const m = connectionString.match(/\/\/([^:]+):/);
  return m?.[1] ?? null;
}

function parseConnectionTarget(connectionString) {
  try {
    const parsed = new URL(connectionString);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname?.replace(/^\//, "") || "postgres",
    };
  } catch {
    return null;
  }
}

async function trySessionPooler(target) {
  const client = new pg.Client({
    host: target.host,
    port: target.port,
    user: target.user,
    password: target.password,
    database: target.database,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return { ok: true };
  } catch (err) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return { ok: false, code: err.code, message: err.message };
  }
}

const env = loadEnvFile(path.join(process.cwd(), ".env"));
const directUrl = env.DIRECT_URL;

if (!directUrl) {
  console.error("Missing DIRECT_URL in .env");
  process.exit(1);
}

const user = parsePoolerUser(directUrl);
const target = parseConnectionTarget(directUrl);
const projectRef = user?.startsWith("postgres.") ? user.replace("postgres.", "") : null;

if (!user || !target?.password) {
  console.error("Could not parse user/password from DIRECT_URL");
  process.exit(1);
}

console.log(`Testing Session pooler (user: ${user}, host: ${target.host}:${target.port}) …\n`);

const result = await trySessionPooler(target);

if (result.ok) {
  console.log("✓ Database login works. Run: npx prisma db push");
  process.exit(0);
}

console.log(`✗ ${result.code ?? "ERROR"}: ${result.message}\n`);

if (result.code === "28P01") {
  console.log(
    [
      "This is the same as Prisma P1000 — the database password is wrong for this project.",
      "",
      "Fix:",
      `  1. Supabase Dashboard → project ${projectRef ?? "(your project)"}`,
      "  2. Project Settings → Database → Reset database password",
      "  3. Copy the new password into BOTH DATABASE_URL and DIRECT_URL in .env",
      "  4. npm run db:test   then   npx prisma db push",
    ].join("\n"),
  );
} else {
  console.log(
    `Check project is not paused and DIRECT_URL host (${target.host}:${target.port}) matches your dashboard.`,
  );
}

process.exit(1);
