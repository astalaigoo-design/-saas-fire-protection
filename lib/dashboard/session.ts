import { currentUser } from "@clerk/nextjs/server";
import type { AppRole } from "@/lib/auth/roles";
import {
  COMPANY_METADATA_KEY,
  parseAppRoleFromMetadata,
  resolveAppRole,
} from "@/lib/auth/roles";
import { resolveCompanyIdForClerkUser } from "@/lib/clerk/webhook/resolve-company";
import { prisma } from "@/lib/prisma";

export type DashboardSession = {
  clerkUserId: string;
  email: string | null;
  appUserId: string;
  companyId: string;
  companyName: string;
  role: AppRole;
};

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const roleFromMetadata = resolveAppRole(
    clerkUser.publicMetadata as Record<string, unknown>,
    clerkUser.unsafeMetadata as Record<string, unknown> | undefined,
  );
  const role = parseAppRoleFromMetadata(
    clerkUser.publicMetadata as Record<string, unknown>,
    clerkUser.unsafeMetadata as Record<string, unknown> | undefined,
  );

  let appUser = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id, active: true },
    include: { company: true },
  });

  if (!appUser) {
    const companyIdRaw = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.[
      COMPANY_METADATA_KEY
    ];
    const companyIdFromMetadata =
      typeof companyIdRaw === "string" && companyIdRaw.trim().length > 0
        ? companyIdRaw.trim()
        : null;

    const companyResult = await resolveCompanyIdForClerkUser(companyIdFromMetadata);
    if ("error" in companyResult) {
      console.error(
        "Dashboard session: failed to auto-provision user, no company resolved",
        companyResult.error,
        clerkUser.id,
      );
      return null;
    }

    try {
      appUser = await prisma.user.upsert({
        where: {
          companyId_clerkUserId: {
            companyId: companyResult.companyId,
            clerkUserId: clerkUser.id,
          },
        },
        create: {
          companyId: companyResult.companyId,
          clerkUserId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null,
          role: roleFromMetadata,
          active: true,
          deletedAt: null,
        },
        update: {
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null,
          role: roleFromMetadata,
          active: true,
          deletedAt: null,
        },
        include: { company: true },
      });
    } catch (error) {
      console.error("Dashboard session: auto-provision upsert failed", error, clerkUser.id);
      return null;
    }
  }

  const resolvedRole =
    appUser.role ?? role ?? resolveAppRole(
      clerkUser.publicMetadata as Record<string, unknown>,
      clerkUser.unsafeMetadata as Record<string, unknown> | undefined,
    );

  return {
    clerkUserId: clerkUser.id,
    email:
      clerkUser.primaryEmailAddress?.emailAddress ??
      appUser.email ??
      null,
    appUserId: appUser.id,
    companyId: appUser.companyId,
    companyName: appUser.company.name,
    role: resolvedRole,
  };
}
