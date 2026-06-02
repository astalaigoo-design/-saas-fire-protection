import "dotenv/config";
import { execSync } from "node:child_process";
import { listMigrationNames } from "./list-migrations.mjs";

console.log(`Migrations in repo: ${listMigrationNames().length}\n`);

try {
  execSync("npx prisma migrate status", { stdio: "inherit" });
} catch {
  // prisma exits 1 when migrations are pending — still useful output above
  process.exitCode = 1;
}
