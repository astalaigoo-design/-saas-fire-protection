import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma generate");

try {
  run("npx prisma migrate deploy");
  console.log("Prisma migrations applied.");
} catch (error) {
  console.warn(
    "Prisma migrate deploy failed — continuing build. Set DIRECT_URL on Vercel and run `npx prisma migrate deploy` against production.",
  );
  console.warn(error);
}

run("npx next build");
