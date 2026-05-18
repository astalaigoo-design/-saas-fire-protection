import { currentUser } from "@clerk/nextjs/server";
import type { AppRole } from "@/lib/auth/roles";
import { parseAppRoleFromMetadata, resolveAppRole } from "@/lib/auth/roles";
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

  const role = parseAppRoleFromMetadata(
    clerkUser.publicMetadata as Record<string, unknown>,
    clerkUser.unsafeMetadata as Record<string, unknown> | undefined,
  );

  const appUser = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id, active: true },
    include: { company: true },
  });

  if (!appUser) return null;

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
