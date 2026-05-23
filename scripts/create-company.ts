/**
 * Create a real tenant company and optionally link a Clerk user as owner.
 *
 * Usage:
 *   npx tsx scripts/create-company.ts "Acme Fire Protection"
 *   npx tsx scripts/create-company.ts "Acme Fire Protection" user_xxx owner
 *
 * Env:
 *   CREATE_COMPANY_NAME="Acme Fire Protection"
 *   CREATE_CLERK_USER_ID=user_xxx
 *   CREATE_USER_ROLE=owner
 */
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { APP_ROLES, isAppRole } from "../lib/auth/roles";
import { syncClerkPublicMetadata } from "../lib/clerk/sync-public-metadata";
import { createCompanyWithDefaults } from "../lib/companies/bootstrap-company";

const prisma = new PrismaClient();

const argsSchema = z.object({
  companyName: z.string().min(2, "Company name required"),
  clerkUserId: z.string().min(1).optional(),
  role: z.enum(APP_ROLES).default("owner"),
});

async function main() {
  const companyName =
    process.argv[2]?.trim() || process.env.CREATE_COMPANY_NAME?.trim() || "";
  const clerkUserId =
    process.argv[3]?.trim() || process.env.CREATE_CLERK_USER_ID?.trim() || undefined;
  const roleInput =
    process.argv[4]?.trim() || process.env.CREATE_USER_ROLE?.trim() || "owner";

  if (!companyName) {
    console.error(
      'Usage: npx tsx scripts/create-company.ts "<company name>" [clerk_user_id] [owner|admin|technician]',
    );
    process.exitCode = 1;
    return;
  }

  if (!isAppRole(roleInput)) {
    console.error(`Invalid role "${roleInput}". Use: ${APP_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const parsed = argsSchema.parse({
    companyName,
    clerkUserId,
    role: roleInput,
  });

  const existing = await prisma.company.findFirst({
    where: { name: parsed.companyName },
    select: { id: true, name: true },
  });
  if (existing) {
    console.error(`Company already exists: "${existing.name}" (${existing.id})`);
    console.error("Use fix-user with FIX_COMPANY_ID to link a user, or pick a different name.");
    process.exitCode = 1;
    return;
  }

  const company = await createCompanyWithDefaults(parsed.companyName);
  console.log("Created company:", company.name);
  console.log("  id:", company.id);
  console.log("  Inspection types: annual, quarterly, monthly");

  if (!parsed.clerkUserId) {
    console.log("\nNext: link an owner with:");
    console.log(`  FIX_COMPANY_ID=${company.id} npm run fix-user -- <clerk_user_id> owner`);
    console.log("\nOr set Clerk public metadata:");
    console.log(`  { "role": "owner", "companyId": "${company.id}" }`);
    return;
  }

  const user = await prisma.user.upsert({
    where: {
      companyId_clerkUserId: {
        companyId: company.id,
        clerkUserId: parsed.clerkUserId,
      },
    },
    update: { role: parsed.role, active: true, deletedAt: null },
    create: {
      companyId: company.id,
      clerkUserId: parsed.clerkUserId,
      role: parsed.role,
    },
  });

  const metadataSync = await syncClerkPublicMetadata(parsed.clerkUserId, {
    role: parsed.role,
    companyId: company.id,
  });
  if (!metadataSync.ok) {
    throw new Error(metadataSync.error);
  }

  console.log("\nLinked user:", user.id, "role:", user.role);
  console.log("Sign out and sign in again at https://getflareflow.com");
}

main()
  .catch((error: unknown) => {
    console.error("create-company failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
