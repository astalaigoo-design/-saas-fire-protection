import { execSync } from "node:child_process";

const steps = [
  { name: "Prisma generate", command: "npx prisma generate" },
  { name: "SEO static files", command: "node scripts/generate-seo-static.mjs" },
  { name: "Database migrations", command: "node scripts/db/migrate-deploy.mjs" },
  { name: "Next.js build", command: "npx next build" },
];

function runStep(name, command) {
  console.log(`\n▶ ${name}`);
  console.log(`  $ ${command}\n`);
  try {
    execSync(command, { stdio: "inherit", env: process.env });
  } catch (error) {
    const code = error.status ?? 1;
    console.error(`\n✖ ${name} failed (exit ${code})`);
    if (name === "Database migrations") {
      console.error(
        "  Ensure Vercel Production has DIRECT_URL (session, port 5432) enabled for Build + Runtime.",
      );
    }
    process.exit(code);
  }
}

console.log(
  `Vercel build — Node ${process.version}, VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}`,
);
console.log(
  `  VERCEL_PROJECT: ${process.env.VERCEL_PROJECT_NAME ?? "(local)"}`,
);
console.log(
  `  DATABASE_URL: ${process.env.DATABASE_URL?.trim() ? "set" : "missing"}`,
);
console.log(
  `  DIRECT_URL: ${process.env.DIRECT_URL?.trim() ? "set" : "missing"}`,
);

for (const step of steps) {
  runStep(step.name, step.command);
}

console.log("\n✔ Vercel build finished.");
