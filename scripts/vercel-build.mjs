import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma generate");
run("npx tsx scripts/generate-seo-static.ts");

try {
  run("npx prisma migrate deploy");
  console.log("Prisma migrations applied.");
} catch (error) {
  console.warn(
    "Prisma migrate deploy failed — continuing build. Set DIRECT_URL on Vercel and run `npx prisma migrate deploy` against production.",
  );
  console.warn(error);
}

try {
  run("npx prisma db execute --file scripts/db/ensure-idempotency.sql --schema prisma/schema.prisma");
  console.log("Idempotency table ensured.");
} catch (error) {
  console.warn("Could not ensure idempotency table — continuing build.");
  console.warn(error);
}

try {
  run(
    "npx prisma db execute --file scripts/db/ensure-quote-share-token.sql --schema prisma/schema.prisma",
  );
  console.log("Quote shareToken column ensured.");
} catch (error) {
  console.warn("Could not ensure quote shareToken column — continuing build.");
  console.warn(error);
}

run("npx next build");
