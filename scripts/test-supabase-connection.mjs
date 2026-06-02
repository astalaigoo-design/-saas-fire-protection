/**
 * Verifies Supabase/Postgres credentials from .env (run: npm run db:test or npm run db:check).
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

/**
 * @param {string} connectionString
 */
function parsePostgresConfig(connectionString, label) {
  let parsed;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(`${label} is not a valid URL. URL-encode special characters in the password.`);
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${label} must use postgresql://`);
  }

  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);

  if (!user || !password) {
    throw new Error(`${label} is missing username or password.`);
  }

  return {
    label,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    user,
    password,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
  };
}

/**
 * @param {ReturnType<typeof parsePostgresConfig>} config
 */
async function tryConnect(config) {
  const client = new pg.Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query("SELECT 1 AS ok");
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

function printAuthHelp(projectRef) {
  console.log(
    [
      "This is the same as Prisma P1000 — the database password is wrong for this project.",
      "",
      "Fix:",
      `  1. Supabase Dashboard → project ${projectRef ?? "(your project ref)"}`,
      "  2. Project Settings → Database → Reset database password",
      "  3. Copy fresh URIs from Connect → ORMs into BOTH DATABASE_URL and DIRECT_URL in .env",
      "  4. npm run db:check   then   npx prisma migrate deploy",
    ].join("\n"),
  );
}

const env = loadEnvFile(path.join(process.cwd(), ".env"));
const directUrl = env.DIRECT_URL?.trim();
const databaseUrl = env.DATABASE_URL?.trim();

if (!directUrl && !databaseUrl) {
  console.error("Missing DATABASE_URL and DIRECT_URL in .env");
  console.error("Copy both from Supabase → Project Settings → Database → Connect → ORMs.");
  process.exit(1);
}

/** Prefer session pooler (5432) for a direct SQL login test; fall back to DATABASE_URL. */
const primaryUrl = directUrl || databaseUrl;
const secondaryUrl = directUrl && databaseUrl && databaseUrl !== directUrl ? databaseUrl : null;

let config;
try {
  config = parsePostgresConfig(primaryUrl, directUrl ? "DIRECT_URL" : "DATABASE_URL");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const projectRef = config.user.startsWith("postgres.")
  ? config.user.replace("postgres.", "")
  : null;

console.log(
  `Testing ${config.label} (${config.user} @ ${config.host}:${config.port}/${config.database}) …\n`,
);

let result = await tryConnect(config);

if (!result.ok && secondaryUrl) {
  let secondaryConfig;
  try {
    secondaryConfig = parsePostgresConfig(secondaryUrl, "DATABASE_URL");
    console.log(
      `Primary failed; trying DATABASE_URL @ ${secondaryConfig.host}:${secondaryConfig.port} …\n`,
    );
    result = await tryConnect(secondaryConfig);
    if (result.ok) config = secondaryConfig;
  } catch {
    /* keep primary error */
  }
}

if (result.ok) {
  console.log("✓ Database login works.");
  if (!directUrl) {
    console.log(
      "  Tip: add DIRECT_URL (session pooler, port 5432) for migrations — see .env.example.",
    );
  }
  console.log("\nNext: npx prisma migrate deploy   (or npx prisma db push on a fresh dev DB)");
  process.exit(0);
}

console.log(`✗ ${result.code ?? "ERROR"}: ${result.message}\n`);

if (result.code === "28P01") {
  printAuthHelp(projectRef);
} else if (result.code === "ENOTFOUND" || result.code === "EAI_AGAIN") {
  console.log("Hostname could not be resolved — check the pooler host matches your Supabase region.");
} else {
  console.log(
    `Check the project is not paused and ${config.host}:${config.port} matches Supabase Connect → ORMs.`,
  );
}

process.exit(1);
