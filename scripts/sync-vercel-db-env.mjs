/**
 * Sync DATABASE_URL and DIRECT_URL from local .env to Vercel (all environments).
 *
 * Usage: node scripts/sync-vercel-db-env.mjs
 */
import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const KEYS = ["DATABASE_URL", "DIRECT_URL"];
const ENVIRONMENTS = [
  { name: "production", sensitive: true },
  { name: "preview", sensitive: true },
  { name: "development", sensitive: false },
];

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

function upsertEnv(name, environment, value, sensitive) {
  const encoded = JSON.stringify(value);
  const sensitiveFlag = sensitive ? " --sensitive" : " --no-sensitive";
  console.log(`\n→ ${name} (${environment})`);
  try {
    run(
      `npx vercel env update ${name} ${environment} --value ${encoded} --yes${sensitiveFlag}`,
    );
  } catch {
    run(
      `npx vercel env add ${name} ${environment} --value ${encoded} --yes --force${sensitiveFlag}`,
    );
  }
}

for (const { name: environment, sensitive } of ENVIRONMENTS) {
  for (const key of KEYS) {
    const value = process.env[key]?.trim();
    if (!value) {
      console.error(`Missing ${key} in .env — copy from .env.example and Supabase Connect.`);
      process.exitCode = 1;
      process.exit(1);
    }
    upsertEnv(key, environment, value, sensitive);
  }
}

console.log("\n✔ Vercel DATABASE_URL and DIRECT_URL synced for production, preview, and development.");
console.log("  Redeploy production: npx vercel --prod");
