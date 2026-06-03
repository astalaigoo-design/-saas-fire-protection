import { loadEnv } from "./load-env.mjs";

loadEnv();

/**
 * One-time baseline for databases that already have the schema (e.g. from db push)
 * but no Prisma migration history (_prisma_migrations). Marks each migration as
 * applied without re-running SQL, then runs migrate deploy for anything pending.
 *
 * Usage (production — uses DIRECT_URL from .env):
 *   npm run db:baseline-migrations -- --yes
 *   npm run db:baseline-migrations -- --yes --verify   # diff check before baseline
 *   npm run db:baseline-migrations -- --dry-run
 */
import { execSync } from "node:child_process";
import { listMigrationNames } from "./list-migrations.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const yes = args.has("--yes");
const verify = args.has("--verify");

function run(command, options = {}) {
  return execSync(command, { stdio: "inherit", encoding: "utf8", ...options });
}

function runCapture(command) {
  return execSync(command, { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"] }).trim();
}

function ensureDirectUrl() {
  const direct = process.env.DIRECT_URL?.trim();
  const database = process.env.DATABASE_URL?.trim();
  if (!direct && !database) {
    console.error(
      "Set DIRECT_URL (recommended) or DATABASE_URL before baselining. Use the Supabase direct/session connection for migrations.",
    );
    process.exit(1);
  }
  if (!direct) {
    console.warn(
      "Warning: DIRECT_URL is not set. Using DATABASE_URL for Prisma CLI — prefer DIRECT_URL (port 5432) for migrate resolve/deploy.",
    );
  }
}

function verifySchemaMatchesMigrations() {
  console.log("Checking that the live database matches prisma/schema.prisma...");
  const datasource =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  if (!datasource) {
    console.error("Set DIRECT_URL or DATABASE_URL for --verify.");
    process.exit(1);
  }

  try {
    const diff = runCapture(
      `npx prisma migrate diff --from-url "${datasource}" --to-schema-datamodel prisma/schema.prisma --script`,
    );
    const sqlOnly = diff
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, "")
      .trim();
    if (sqlOnly.length > 0) {
      console.error(
        "Schema drift detected. The database does not match prisma/schema.prisma. Review the diff before baselining:\n",
      );
      console.error(diff);
      process.exit(1);
    }
    console.log("Database matches schema — safe to mark migrations as applied.");
  } catch (error) {
    const combined = `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? error}`;
    if (combined.trim().length > 0) {
      console.error("migrate diff reported an error:\n", combined);
      process.exit(1);
    }
    console.warn("Could not run migrate diff verification:", error.message ?? error);
    if (!yes) process.exit(1);
  }
}

function listPendingFromStatus() {
  let output = "";
  try {
    output = runCapture("npx prisma migrate status");
  } catch (error) {
    const stderr = error.stderr?.toString() ?? "";
    const stdout = error.stdout?.toString() ?? "";
    output = `${stdout}\n${stderr}`;
  }

  const pending = [];
  const notAppliedSection = output.includes("Following migrations have not yet been applied");
  if (notAppliedSection) {
    const lines = output.split("\n");
    let inPending = false;
    for (const line of lines) {
      if (line.includes("have not yet been applied")) {
        inPending = true;
        continue;
      }
      if (inPending) {
        const match = line.match(/^\d{14}_[\w]+/);
        if (match) pending.push(match[0]);
        if (line.trim() === "" && pending.length > 0) break;
      }
    }
  }

  return { output, pending };
}

function main() {
  ensureDirectUrl();

  const allMigrations = listMigrationNames();
  console.log(`Found ${allMigrations.length} migrations in prisma/migrations.`);

  if (verify) {
    verifySchemaMatchesMigrations();
  }

  const { output: statusOutput, pending } = listPendingFromStatus();
  console.log("\n--- migrate status ---\n");
  console.log(statusOutput || "(no output)");
  console.log("--- end status ---\n");

  const toResolve =
    pending.length > 0
      ? pending
      : statusOutput.includes("P3005") || statusOutput.includes("not empty")
        ? allMigrations
        : [];

  if (toResolve.length === 0) {
    console.log("No pending migrations to baseline (history may already be complete).");
    if (!dryRun) {
      console.log("Running migrate deploy for any new migrations...");
      run("npx prisma migrate deploy");
    }
    return;
  }

  if (!yes && !dryRun) {
    console.log(
      `Would mark ${toResolve.length} migration(s) as applied via prisma migrate resolve.`,
    );
    console.log("Re-run with --yes to apply (and --verify to diff-check first).");
    process.exit(0);
  }

  for (const name of toResolve) {
    console.log(`${dryRun ? "[dry-run] " : ""}migrate resolve --applied ${name}`);
    if (!dryRun) {
      try {
        run(`npx prisma migrate resolve --applied "${name}"`);
      } catch (error) {
        const msg = String(error.stderr ?? error.stdout ?? error.message ?? error);
        if (msg.includes("already recorded") || msg.includes("P3008")) {
          console.log(`  (already applied: ${name})`);
          continue;
        }
        throw error;
      }
    }
  }

  if (dryRun) {
    console.log("\nDry run complete. Re-run with --yes to baseline.");
    return;
  }

  console.log("\nRunning prisma migrate deploy...");
  run("npx prisma migrate deploy");
  console.log("\nBaseline complete. Future Vercel builds should apply new migrations cleanly.");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
