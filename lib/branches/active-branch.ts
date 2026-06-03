import { cookies } from "next/headers";
import { isOwner } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";
import { BRANCH_COOKIE_NAME } from "@/lib/branches/constants";
import { prisma } from "@/lib/prisma";

export async function readBranchCookie(): Promise<string | null> {
  const value = (await cookies()).get(BRANCH_COOKIE_NAME)?.value?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Resolve which branch filters dashboard data.
 * Owners may use a cookie to focus one branch; others use their assigned branch.
 */
export async function resolveActiveBranchId(input: {
  companyId: string;
  role: AppRole;
  userBranchId: string | null;
  cookieBranchId: string | null;
}): Promise<string | null> {
  if (!isOwner(input.role)) {
    return input.userBranchId;
  }

  if (!input.cookieBranchId) return null;

  const branch = await prisma.branch.findFirst({
    where: { id: input.cookieBranchId, companyId: input.companyId },
    select: { id: true },
  });
  return branch?.id ?? null;
}
