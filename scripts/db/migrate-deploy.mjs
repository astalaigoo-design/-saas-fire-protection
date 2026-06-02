import "dotenv/config";

/**
 * Applies pending Prisma migrations (used by Vercel build and locally).
 * Exits non-zero on failure so deploys do not silently skip schema updates.
 */
import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function main() {
  if (!process.env.DIRECT_URL?.trim() && !process.env.DATABASE_URL?.trim()) {
    console.error(
      "migrate-deploy: DIRECT_URL or DATABASE_URL must be set (Vercel Production: use direct Postgres URL for migrations).",
    );
    process.exit(1);
  }

  try {
    run("npx prisma migrate deploy");
    console.log("Prisma migrate deploy: success.");
  } catch (error) {
    const message = String(error.stderr ?? error.stdout ?? error.message ?? error);
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
