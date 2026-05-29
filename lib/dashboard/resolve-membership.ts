import type { Company, User } from "@prisma/client";
import { resolveCompanyIdForClerkUser } from "@/lib/clerk/webhook/resolve-company";
import { syncClerkPublicMetadata } from "@/lib/clerk/sync-public-metadata";
import type { AppRole } from "@/lib/auth/roles";
import {
  isSharedTenantCompany,
  isSharedTenantOperator,
  shouldMigrateOffSharedTenant,
} from "@/lib/companies/shared-tenant";
import { prisma } from "@/lib/prisma";

export type UserMembership = User & { company: Company };

export { isSharedTenantCompany, shouldMigrateOffSharedTenant };

function sortNewestFirst(memberships: UserMembership[]): UserMembership[] {
  return [...memberships].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

/**
 * Pick the active company membership for this Clerk user.
 * Never keeps self-serve users on the shared demo; only private tenants or explicit invites.
 */
export function pickActiveMembership(
  memberships: UserMembership[],
  companyIdFromMetadata: string | null,
): UserMembership | null {
  if (memberships.length === 0) return null;

  if (companyIdFromMetadata) {
    const fromMetadata = memberships.find((m) => m.companyId === companyIdFromMetadata);
    if (fromMetadata && !shouldMigrateOffSharedTenant(companyIdFromMetadata, fromMetadata.company)) {
      return fromMetadata;
    }
  }

  const privateTenants = memberships.filter((m) => !isSharedTenantCompany(m.company));
  if (privateTenants.length === 1) {
    return privateTenants[0] ?? null;
  }
  if (privateTenants.length > 1) {
    return sortNewestFirst(privateTenants)[0] ?? null;
  }

  // Only shared/demo membership(s) — caller provisions a private tenant.
  return null;
}

export async function listActiveMemberships(
  clerkUserId: string,
  email?: string | null,
): Promise<UserMembership[]> {
  const byClerk = await prisma.user.findMany({
    where: { clerkUserId, active: true },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return byClerk;

  const byEmail = await prisma.user.findMany({
    where: {
      active: true,
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  const merged = new Map<string, UserMembership>();
  for (const row of [...byClerk, ...byEmail]) {
    merged.set(row.id, row);
  }
  return Array.from(merged.values());
}

/** Ensure the signed-in Clerk user has an active row on the chosen company. */
async function linkClerkUserToCompany(
  clerkUserId: string,
  companyId: string,
  input: EnsureMembershipInput,
): Promise<UserMembership> {
  return prisma.user.upsert({
    where: {
      companyId_clerkUserId: {
        companyId,
        clerkUserId,
      },
    },
    create: {
      companyId,
      clerkUserId,
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
  const memberships = await listActiveMemberships(input.clerkUserId, input.email);
  let chosen = pickActiveMembership(memberships, input.companyIdFromMetadata);

  if (!chosen && input.companyIdFromMetadata) {
    return {
      ok: false,
      error: `No active membership for company ${input.companyIdFromMetadata}.`,
    };
  }

  const stuckOnSharedOnly =
    memberships.length > 0 && memberships.every((m) => isSharedTenantCompany(m.company));

  if (
    !chosen &&
    stuckOnSharedOnly &&
    isSharedTenantOperator(input.clerkUserId, input.email)
  ) {
    chosen = sortNewestFirst(memberships)[0] ?? null;
  }

  if (!chosen && stuckOnSharedOnly) {
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

    chosen = await linkClerkUserToCompany(
      input.clerkUserId,
      companyResult.companyId,
      input,
    );

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

    chosen = await linkClerkUserToCompany(
      input.clerkUserId,
      companyResult.companyId,
      input,
    );
  }

  if (
    chosen &&
    chosen.clerkUserId !== input.clerkUserId &&
    !isSharedTenantCompany(chosen.company)
  ) {
    chosen = await linkClerkUserToCompany(
      input.clerkUserId,
      chosen.companyId,
      input,
    );
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
