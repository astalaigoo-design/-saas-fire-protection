import { currentUser } from "@clerk/nextjs/server";
import type { AppRole } from "@/lib/auth/roles";
import {
  BRANCH_METADATA_KEY,
  COMPANY_METADATA_KEY,
  parseAppRoleFromMetadata,
  resolveAppRole,
} from "@/lib/auth/roles";
import type { EnsureMembershipInput } from "@/lib/dashboard/resolve-membership";

export async function getClerkProvisioningInput(): Promise<EnsureMembershipInput | null> {
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

  const branchIdRaw = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.[
    BRANCH_METADATA_KEY
  ];
  const branchIdFromMetadata =
    typeof branchIdRaw === "string" && branchIdRaw.trim().length > 0
      ? branchIdRaw.trim()
      : null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;

  return {
    clerkUserId: clerkUser.id,
    email,
    name,
    role: role ?? roleFromMetadata,
    companyIdFromMetadata,
    branchIdFromMetadata,
  };
}
