import type { Company, User } from "@prisma/client";
import { resolveCompanyIdForClerkUser } from "@/lib/clerk/webhook/resolve-company";
import { syncClerkPublicMetadata } from "@/lib/clerk/sync-public-metadata";
import type { AppRole } from "@/lib/auth/roles";
import { APP_NAME, DEMO_COMPANY_NAME } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

export type UserMembership = User & { company: Company };

/** Companies used for demos / shared testing — not a user's private tenant. */
export function isSharedTenantCompany(company: Pick<Company, "id" | "name">): boolean {
  const sharedId = process.env.SHARED_TENANT_COMPANY_ID?.trim();
  if (sharedId && company.id === sharedId) return true;
  if (company.name === DEMO_COMPANY_NAME) return true;
  // Legacy production demo workspace (same name as the product).
  if (company.name === APP_NAME) return true;
  return false;
}

function sortNewestFirst(memberships: UserMembership[]): UserMembership[] {
  return [...memberships].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

/**
 * Pick the active company membership for this Clerk user.
 * Prefers explicit metadata, then a private tenant, never a shared demo unless metadata says so.
 */
export function pickActiveMembership(
  memberships: UserMembership[],
  companyIdFromMetadata: string | null,
): UserMembership | null {
  if (memberships.length === 0) return null;

  if (companyIdFromMetadata) {
    return memberships.find((m) => m.companyId === companyIdFromMetadata) ?? null;
  }

  if (memberships.length === 1) {
    return memberships[0] ?? null;
  }

  const privateTenants = memberships.filter((m) => !isSharedTenantCompany(m.company));
  if (privateTenants.length === 1) {
    return privateTenants[0] ?? null;
  }
  if (privateTenants.length > 1) {
    return sortNewestFirst(privateTenants)[0] ?? null;
  }

  // Only shared/demo memberships and no metadata — caller should provision a private tenant.
  return null;
}

export async function listActiveMemberships(clerkUserId: string): Promise<UserMembership[]> {
  return prisma.user.findMany({
    where: { clerkUserId, active: true },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
}

export type EnsureMembershipInput = {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: AppRole;
  companyIdFromMetadata: string | null;
};

export type EnsureMembershipResult =
  | { ok: true; membership: UserMembership }
  | { ok: false; error: string };

/**
 * Resolve (or create) the single tenant a signed-in user should use.
 * Migrates self-serve users off shared demo companies automatically.
 */
export async function ensureUserMembership(
  input: EnsureMembershipInput,
): Promise<EnsureMembershipResult> {
  const memberships = await listActiveMemberships(input.clerkUserId);
  let chosen = pickActiveMembership(memberships, input.companyIdFromMetadata);

  if (!chosen && input.companyIdFromMetadata) {
    return {
      ok: false,
      error: `No active membership for company ${input.companyIdFromMetadata}.`,
    };
  }

  if (
    !chosen &&
    !input.companyIdFromMetadata &&
    memberships.length > 0 &&
    memberships.every((m) => isSharedTenantCompany(m.company))
  ) {
    const companyResult = await resolveCompanyIdForClerkUser(null, {
      userEmail: input.email,
      userName: input.name,
    });
    if ("error" in companyResult) {
      return { ok: false, error: companyResult.error };
    }

    await prisma.user.updateMany({
      where: {
        clerkUserId: input.clerkUserId,
        companyId: { in: memberships.map((m) => m.companyId) },
        active: true,
      },
      data: { active: false, deletedAt: new Date() },
    });

    chosen = await prisma.user.upsert({
      where: {
        companyId_clerkUserId: {
          companyId: companyResult.companyId,
          clerkUserId: input.clerkUserId,
        },
      },
      create: {
        companyId: companyResult.companyId,
        clerkUserId: input.clerkUserId,
        email: input.email,
        name: input.name,
        role: input.role,
        active: true,
        deletedAt: null,
      },
      update: {
        email: input.email,
        name: input.name,
        role: input.role,
        active: true,
        deletedAt: null,
      },
      include: { company: true },
    });

    console.info(
      "Dashboard session: migrated user off shared tenant to",
      chosen.company.name,
      chosen.companyId,
      input.clerkUserId,
    );
  }

  if (!chosen) {
    const companyResult = await resolveCompanyIdForClerkUser(input.companyIdFromMetadata, {
      userEmail: input.email,
      userName: input.name,
    });
    if ("error" in companyResult) {
      return { ok: false, error: companyResult.error };
    }

    chosen = await prisma.user.upsert({
      where: {
        companyId_clerkUserId: {
          companyId: companyResult.companyId,
          clerkUserId: input.clerkUserId,
        },
      },
      create: {
        companyId: companyResult.companyId,
        clerkUserId: input.clerkUserId,
        email: input.email,
        name: input.name,
        role: input.role,
        active: true,
        deletedAt: null,
      },
      update: {
        email: input.email,
        name: input.name,
        role: input.role,
        active: true,
        deletedAt: null,
      },
      include: { company: true },
    });
  }

  const metadataSync = await syncClerkPublicMetadata(input.clerkUserId, {
    role: input.role,
    companyId: chosen.companyId,
  });
  if (!metadataSync.ok) {
    console.error(
      "Dashboard session: membership resolved but Clerk metadata sync failed",
      metadataSync.error,
      input.clerkUserId,
    );
  }

  return { ok: true, membership: chosen };
}
