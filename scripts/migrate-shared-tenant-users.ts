/**
 * Move users who only belong to the shared demo company onto a new private tenant.
 *
 * Usage:
 *   npx tsx scripts/migrate-shared-tenant-users.ts
 *   npx tsx scripts/migrate-shared-tenant-users.ts user_xxx
 */
import { PrismaClient } from "@prisma/client";
import {
  isSharedTenantCompany,
  isSharedTenantOperator,
} from "../lib/companies/shared-tenant";
import { syncClerkPublicMetadata } from "../lib/clerk/sync-public-metadata";
import {
  buildCompanyNameForNewSignup,
} from "../lib/clerk/webhook/resolve-company";
import { createCompanyWithDefaults } from "../lib/companies/bootstrap-company";

const prisma = new PrismaClient();

async function migrateClerkUser(clerkUserId: string) {
  const memberships = await prisma.user.findMany({
    where: { clerkUserId, active: true },
    include: { company: true },
  });

  if (memberships.length === 0) {
    console.log("Skip (no active membership):", clerkUserId);
    return;
  }

  const privateTenants = memberships.filter((m) => !isSharedTenantCompany(m.company));
  if (privateTenants.length > 0) {
    console.log("Skip (already has private tenant):", clerkUserId);
    return;
  }

  if (!memberships.every((m) => isSharedTenantCompany(m.company))) {
    console.log("Skip (mixed memberships — fix manually):", clerkUserId);
    return;
  }

  const sample = memberships[0];
  if (isSharedTenantOperator(clerkUserId, sample?.email)) {
    console.log("Skip (shared-tenant operator allowlist):", clerkUserId);
    return;
  }
  const companyName = buildCompanyNameForNewSignup({
    userEmail: sample?.email,
    userName: sample?.name,
  });
  const company = await createCompanyWithDefaults(companyName);

  await prisma.user.updateMany({
    where: {
      clerkUserId,
      companyId: { in: memberships.map((m) => m.companyId) },
      active: true,
    },
    data: { active: false, deletedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: {
      companyId_clerkUserId: {
        companyId: company.id,
        clerkUserId,
      },
    },
    create: {
      companyId: company.id,
      clerkUserId,
      email: sample?.email ?? null,
      name: sample?.name ?? null,
      role: sample?.role ?? "owner",
      active: true,
      deletedAt: null,
    },
    update: {
      active: true,
      deletedAt: null,
    },
  });

  const metadataSync = await syncClerkPublicMetadata(clerkUserId, {
    role: user.role,
    companyId: company.id,
  });
  if (!metadataSync.ok) {
    console.warn("DB migrated but Clerk metadata sync failed:", metadataSync.error);
    console.warn("User must sign out/in after CLERK_SECRET_KEY matches their Clerk app.");
  }

  console.log("Migrated:", clerkUserId, "→", company.name, company.id);
}

async function migrateByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await prisma.user.findMany({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { clerkUserId: true },
    distinct: ["clerkUserId"],
  });
  console.log(`Migrating ${rows.length} Clerk account(s) for ${normalized}`);
  for (const row of rows) {
    await migrateClerkUser(row.clerkUserId);
  }
}

async function main() {
  const target = process.argv[2]?.trim();

  if (target) {
    if (target.includes("@")) {
      await migrateByEmail(target);
    } else {
      await migrateClerkUser(target);
    }
    return;
  }

  const sharedCompanies = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  const sharedIds = sharedCompanies
    .filter((c) => isSharedTenantCompany(c))
    .map((c) => c.id);

  const users = await prisma.user.findMany({
    where: { active: true, companyId: { in: sharedIds } },
    select: { clerkUserId: true },
    distinct: ["clerkUserId"],
  });

  console.log(`Found ${users.length} user(s) with membership on shared tenant(s).`);

  for (const row of users) {
    await migrateClerkUser(row.clerkUserId);
  }
}

main()
  .catch((error: unknown) => {
    console.error("migrate-shared-tenant-users failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
