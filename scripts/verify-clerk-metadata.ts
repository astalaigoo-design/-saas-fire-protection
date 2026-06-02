/**
 * Verify Clerk public metadata matches expected role + companyId (and optional DB row).
 *
 * Usage:
 *   npx tsx scripts/verify-clerk-metadata.ts <clerk_user_id>
 *   npx tsx scripts/verify-clerk-metadata.ts <clerk_user_id> --company-id <cuid>
 */
import { PrismaClient } from "@prisma/client";
import {
  COMPANY_METADATA_KEY,
  ROLE_METADATA_KEY,
  isAppRole,
  type AppRole,
} from "../lib/auth/roles";

const prisma = new PrismaClient();

type ClerkUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: { email_address: string }[];
  public_metadata?: Record<string, unknown>;
};

async function fetchClerkUser(clerkUserId: string): Promise<ClerkUser | null> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    console.error("CLERK_SECRET_KEY is not set.");
    return null;
  }

  const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    console.error(`Clerk GET user failed (${response.status}):`, await response.text());
    return null;
  }
  return (await response.json()) as ClerkUser;
}

function readMetadata(user: ClerkUser): {
  role: AppRole | null;
  companyId: string | null;
} {
  const meta = user.public_metadata ?? {};
  const roleRaw = meta[ROLE_METADATA_KEY];
  const companyRaw = meta[COMPANY_METADATA_KEY];
  return {
    role: isAppRole(roleRaw) ? roleRaw : null,
    companyId: typeof companyRaw === "string" && companyRaw.trim() ? companyRaw.trim() : null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const clerkUserId = args.find((a) => !a.startsWith("--"))?.trim();
  const companyIdFlag = args.includes("--company-id")
    ? args[args.indexOf("--company-id") + 1]?.trim()
    : undefined;

  if (!clerkUserId) {
    console.error(
      "Usage: npx tsx scripts/verify-clerk-metadata.ts <clerk_user_id> [--company-id <cuid>]",
    );
    process.exitCode = 1;
    return;
  }

  const user = await fetchClerkUser(clerkUserId);
  if (!user) {
    process.exitCode = 1;
    return;
  }

  const email = user.email_addresses?.[0]?.email_address ?? "(no email)";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "(no name)";
  const { role, companyId } = readMetadata(user);

  console.log("Clerk user:", clerkUserId);
  console.log("  Name:", name);
  console.log("  Email:", email);
  console.log("  public_metadata:", JSON.stringify(user.public_metadata ?? {}, null, 2));

  let ok = true;

  if (!role) {
    console.error("\n✗ Missing or invalid public_metadata.role (expected owner | admin | technician)");
    ok = false;
  } else {
    console.log("\n✓ role:", role);
  }

  if (!companyId) {
    console.error("✗ Missing public_metadata.companyId");
    ok = false;
  } else {
    console.log("✓ companyId:", companyId);
  }

  const expectedCompanyId = companyIdFlag ?? companyId;
  if (expectedCompanyId && companyId && companyId !== expectedCompanyId) {
    console.error(`✗ companyId mismatch: Clerk has ${companyId}, expected ${expectedCompanyId}`);
    ok = false;
  }

  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, designPartner: true },
    });
    if (!company) {
      console.error(`✗ No Company row in Postgres for companyId ${companyId}`);
      ok = false;
    } else {
      console.log(`✓ Company in DB: ${company.name} (designPartner=${company.designPartner})`);
    }

    const membership = await prisma.user.findFirst({
      where: { clerkUserId, companyId, active: true },
      select: { id: true, role: true, email: true },
    });
    if (!membership) {
      console.error("✗ No active User row linking this Clerk id to the company");
      ok = false;
    } else {
      console.log(`✓ DB membership: role=${membership.role}, userId=${membership.id}`);
      if (role && membership.role !== role) {
        console.warn(
          `⚠ DB role (${membership.role}) differs from Clerk metadata (${role}) — run sync-user-clerk-metadata`,
        );
      }
    }
  }

  if (!ok) {
    console.error("\nFix with:");
    console.error(`  FIX_COMPANY_ID=<cuid> npm run fix-user -- ${clerkUserId} owner`);
    console.error(`  npm run sync-user-clerk-metadata -- ${clerkUserId}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nClerk metadata and DB membership look correct.");
  console.log("Owner should sign out and sign in again at https://getflareflow.com");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
