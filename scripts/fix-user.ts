/**
 * Link a Clerk user to the demo company in Prisma and set Clerk publicMetadata.role.
 *
 * Usage:
 *   npx tsx scripts/fix-user.ts <clerk_user_id> [owner|admin|technician]
 *   FIX_CLERK_USER_ID=user_xxx FIX_USER_ROLE=owner npx tsx scripts/fix-user.ts
 */
import { PrismaClient, type UserRole } from "@prisma/client";
import { z } from "zod";
import { APP_ROLES, isAppRole, ROLE_METADATA_KEY } from "../lib/auth/roles";

import { DEMO_COMPANY_NAME } from "../lib/branding";

/** Defaults when no CLI args (override via FIX_* env vars). */
const DEFAULT_CLERK_USER_ID = "user_3Dnb93h5i7s5etCMAo8ybASlMkR";
const DEFAULT_EMAIL = "astalaigoo@gmail.com";
const DEFAULT_NAME = "yousef astalaigoo";

const argsSchema = z.object({
  clerkUserId: z.string().min(1, "Clerk user id required (user_...)"),
  role: z.enum(APP_ROLES).default("owner"),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

const prisma = new PrismaClient();

async function updateClerkPublicRole(clerkUserId: string, role: UserRole) {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("CLERK_SECRET_KEY is missing from .env");
  }

  const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_metadata: { [ROLE_METADATA_KEY]: role },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clerk API ${response.status}: ${body}`);
  }
}

async function fetchClerkProfile(clerkUserId: string) {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) return null;

  const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: { email_address: string }[];
  };

  const email = data.email_addresses?.[0]?.email_address;
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
  return { email: email ?? undefined, name: name ?? undefined };
}

async function listClerkUserIds(): Promise<string[]> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) return [];

  const response = await fetch("https://api.clerk.com/v1/users?limit=10", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) return [];

  const data = (await response.json()) as { id: string }[];
  return data.map((u) => u.id);
}

async function main() {
  const clerkUserId =
    process.argv[2]?.trim() ||
    process.env.FIX_CLERK_USER_ID?.trim() ||
    process.env.SEED_CLERK_OWNER_ID?.trim() ||
    DEFAULT_CLERK_USER_ID;

  const roleInput =
    process.argv[3]?.trim() || process.env.FIX_USER_ROLE?.trim() || "owner";

  if (!clerkUserId) {
    const users = await listClerkUserIds();
    console.error("Missing Clerk user id.\n");
    console.error("Usage: npx tsx scripts/fix-user.ts <clerk_user_id> [owner|admin|technician]");
    if (users.length > 0) {
      console.error("\nUsers in your Clerk app:");
      for (const id of users) {
        console.error(`  ${id}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  if (!isAppRole(roleInput)) {
    console.error(`Invalid role "${roleInput}". Use: ${APP_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const firstName = process.env.FIX_USER_FIRST_NAME?.trim();
  const lastName = process.env.FIX_USER_LAST_NAME?.trim();
  const combinedName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    process.env.FIX_USER_NAME?.trim() ||
    DEFAULT_NAME;

  const parsed = argsSchema.parse({
    clerkUserId,
    role: roleInput,
    email: process.env.FIX_USER_EMAIL?.trim() || DEFAULT_EMAIL,
    name: combinedName,
  });

  const company =
    (await prisma.company.findFirst({
      where: { name: DEMO_COMPANY_NAME },
    })) ?? (await prisma.company.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!company) {
    console.error("No company found. Run: npm run db:seed");
    process.exitCode = 1;
    return;
  }

  console.log("Company:", company.name, company.id);

  const profile = await fetchClerkProfile(parsed.clerkUserId);

  const user = await prisma.user.upsert({
    where: {
      companyId_clerkUserId: {
        companyId: company.id,
        clerkUserId: parsed.clerkUserId,
      },
    },
    update: {
      role: parsed.role,
      email: parsed.email ?? profile?.email ?? null,
      name: parsed.name ?? profile?.name ?? null,
    },
    create: {
      companyId: company.id,
      clerkUserId: parsed.clerkUserId,
      role: parsed.role,
      email: parsed.email ?? profile?.email ?? null,
      name: parsed.name ?? profile?.name ?? null,
    },
  });

  await updateClerkPublicRole(parsed.clerkUserId, parsed.role);

  console.log("User linked!");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Name:", user.name);
  console.log("  Role:", user.role, "(DB + Clerk publicMetadata)");
  console.log("  CompanyId:", user.companyId);
}

main()
  .catch((error: unknown) => {
    console.error("fix-user failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
