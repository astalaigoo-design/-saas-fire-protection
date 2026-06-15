/**
 * Sync DATABASE_URL + DIRECT_URL from .env to Vercel production only.
 * Usage: node scripts/sync-vercel-production-db-only.mjs
 */
import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const KEYS = ["DATABASE_URL", "DIRECT_URL"];

function run(command) {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
    timeout: 300_000,
    windowsHide: true,
  });
}

for (const key of KEYS) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }

  const encoded = JSON.stringify(value);
  console.log(`\n→ ${key} (production)`);

  try {
    run(`npx vercel env rm ${key} production --yes`);
  } catch {
    /* not present */
  }

  run(
    `npx vercel env add ${key} production --value ${encoded} --yes --force --sensitive`,
  );
}

console.log("\n✔ Production DATABASE_URL and DIRECT_URL synced.");
console.log("  Redeploy: npx vercel deploy --prod");
