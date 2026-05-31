/**
 * Sync Clerk publicMetadata (role + companyId) for a user from the DB membership.
 *
 * Usage:
 *   npx tsx scripts/sync-user-clerk-metadata.ts user_xxx
 *   CLERK_SECRET_KEY=sk_live_... npx tsx scripts/sync-user-clerk-metadata.ts user_xxx
 */
import { PrismaClient } from "@prisma/client";
import { syncClerkPublicMetadata } from "../lib/clerk/sync-public-metadata";

const prisma = new PrismaClient();

async function main() {
  const clerkUserId = process.argv[2]?.trim();
  if (!clerkUserId) {
    console.error("Usage: npx tsx scripts/sync-user-clerk-metadata.ts <clerk_user_id>");
    process.exitCode = 1;
    return;
  }

  const membership = await prisma.user.findFirst({
    where: { clerkUserId, active: true },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  if (!membership) {
    console.error("No active DB membership for", clerkUserId);
    process.exitCode = 1;
    return;
  }

  const result = await syncClerkPublicMetadata(clerkUserId, {
    role: membership.role,
    companyId: membership.companyId,
  });

  if (!result.ok) {
    console.error("Sync failed:", result.error);
    process.exitCode = 1;
    return;
  }

  console.log(
    "Synced",
    clerkUserId,
    "→ companyId:",
    membership.companyId,
    `(${membership.company.name})`,
    "role:",
    membership.role,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
