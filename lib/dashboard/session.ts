import { currentUser } from "@clerk/nextjs/server";
import type { AppRole } from "@/lib/auth/roles";
import {
  COMPANY_METADATA_KEY,
  parseAppRoleFromMetadata,
  resolveAppRole,
} from "@/lib/auth/roles";
import { ensureUserMembership } from "@/lib/dashboard/resolve-membership";

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

  const companyIdRaw = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.[
    COMPANY_METADATA_KEY
  ];
  const companyIdFromMetadata =
    typeof companyIdRaw === "string" && companyIdRaw.trim().length > 0
      ? companyIdRaw.trim()
      : null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;
  const resolvedRole = role ?? roleFromMetadata;

  const membershipResult = await ensureUserMembership({
    clerkUserId: clerkUser.id,
    email,
    name,
    role: resolvedRole,
    companyIdFromMetadata,
  });

  if (!membershipResult.ok) {
    console.error(
      "Dashboard session: could not resolve tenant",
      membershipResult.error,
      clerkUser.id,
    );
    return null;
  }

  const appUser = membershipResult.membership;

  return {
    clerkUserId: clerkUser.id,
    email: email ?? appUser.email ?? null,
    appUserId: appUser.id,
    companyId: appUser.companyId,
    companyName: appUser.company.name,
    role: resolvedRole,
  };
}
