/**
 * Read-only: list active users on shared demo tenant(s).
 */
import { PrismaClient } from "@prisma/client";

const APP_NAME = "GetFlareflow";
const DEMO_COMPANY_NAME = "GetFlareflow Demo Co.";
const SHARED_DEMO_COMPANY_ID =
  process.env.SHARED_TENANT_COMPANY_ID?.trim() || "cmpc93rk30000tkngtmv98mra";

const OPERATOR_EMAILS = new Set([
  "astalaigoo@gmail.com",
  "yuri.joseph19@gmail.com",
  ...(process.env.SHARED_TENANT_OPERATOR_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? []),
]);

function isSharedTenantCompany(company) {
  if (company.id === SHARED_DEMO_COMPANY_ID) return true;
  if (company.name === DEMO_COMPANY_NAME) return true;
  if (company.name === APP_NAME) return true;
  return false;
}

function isOperator(clerkUserId, email) {
  const ids = (process.env.SHARED_TENANT_OPERATOR_CLERK_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (ids.includes(clerkUserId)) return true;
  if (email && OPERATOR_EMAILS.has(email.toLowerCase())) return true;
  return false;
}

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  const sharedIds = companies.filter(isSharedTenantCompany).map((c) => c.id);

  const users = await prisma.user.findMany({
    where: { active: true, companyId: { in: sharedIds } },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nShared tenant company IDs: ${sharedIds.join(", ")}`);
  console.log(`Active users on shared tenant(s): ${users.length}\n`);

  for (const u of users) {
    const operator = isOperator(u.clerkUserId, u.email);
    console.log(
      [
        operator ? "[OPERATOR]" : "[MIGRATE]",
        u.email ?? "(no email)",
        u.name ?? "(no name)",
        `role=${u.role}`,
        `company=${u.company.name}`,
        u.clerkUserId,
      ].join(" | "),
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
