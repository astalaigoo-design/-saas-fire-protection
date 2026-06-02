import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma generate");
run("npx tsx scripts/generate-seo-static.ts");

run("node scripts/db/migrate-deploy.mjs");

run("npx next build");
