import { loadEnv } from "./load-env.mjs";
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

loadEnv();

/** Production app on getflareflow.com — only this Vercel project runs migrate deploy. */
const PRIMARY_VERCEL_PROJECT = "saas-fire-protection";

function isVercelBuild() {
  return Boolean(process.env.VERCEL);
}

function shouldSkipMigrations() {
  if (!isVercelBuild()) return false;

  const project = process.env.VERCEL_PROJECT_NAME ?? "";
  if (project && project !== PRIMARY_VERCEL_PROJECT) {
    console.log(
      `migrate-deploy: skipping on Vercel project "${project}" (migrations run only on ${PRIMARY_VERCEL_PROJECT}).`,
    );
    return true;
  }

  const hasDb =
    Boolean(process.env.DIRECT_URL?.trim()) ||
    Boolean(process.env.DATABASE_URL?.trim());

  if (!hasDb && process.env.VERCEL_ENV === "preview") {
    console.log(
      "migrate-deploy: skipping on preview (no DIRECT_URL / DATABASE_URL on this project).",
    );
    return true;
  }

  return false;
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function errorMessage(error) {
  return String(error.stderr ?? error.stdout ?? error.message ?? error);
}

function isRetryableMigrateError(message) {
  return (
    /schema engine error/i.test(message) ||
    /P100[12]/i.test(message) ||
    /timed out/i.test(message) ||
    /advisory lock/i.test(message) ||
    /ECONNRESET/i.test(message)
  );
}

async function runMigrateWithRetry() {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      run("npx prisma migrate deploy");
      return;
    } catch (error) {
      const message = errorMessage(error);
      if (isRetryableMigrateError(message) && attempt < maxAttempts) {
        const waitMs = attempt * 3000;
        console.warn(
          `migrate-deploy: attempt ${attempt} failed (${message.trim().slice(0, 120)}), retrying in ${waitMs / 1000}s…`,
        );
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  if (shouldSkipMigrations()) {
    console.log("Prisma migrate deploy: skipped.");
    return;
  }

  if (!process.env.DIRECT_URL?.trim() && !process.env.DATABASE_URL?.trim()) {
    console.error(
      "migrate-deploy: DIRECT_URL or DATABASE_URL must be set (Vercel Production: use direct Postgres URL for migrations).",
    );
    process.exit(1);
  }

  try {
    await runMigrateWithRetry();
    console.log("Prisma migrate deploy: success.");
  } catch (error) {
    const message = errorMessage(error);
    console.error("Prisma migrate deploy failed.");
    if (message.includes("P3005") || message.includes("not empty")) {
      console.error(`
The database has tables but no Prisma migration history (common after early db push).

One-time fix on production (with DIRECT_URL pointing at production):
  npm run db:baseline-migrations -- --yes --verify

Then redeploy. See README.md → Prisma migration baseline.
`);
    }
    process.exit(1);
  }
}

main();
