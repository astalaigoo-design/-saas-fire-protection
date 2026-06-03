import type { Prisma } from "@prisma/client";
import type { AppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const DEFAULT_BRANCH_NAME = "Main";

export async function ensureDefaultBranchForCompany(
  companyId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  const existing = await client.branch.findFirst({
    where: { companyId, isDefault: true },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  return client.branch.create({
    data: { companyId, name: DEFAULT_BRANCH_NAME, isDefault: true },
    select: { id: true, name: true },
  });
}

/** Branch id assigned on user create/join; owners are company-wide (null). */
export async function resolveBranchIdForNewUser(
  companyId: string,
  role: AppRole,
): Promise<string | null> {
  if (role === "owner") return null;
  const branch = await ensureDefaultBranchForCompany(companyId);
  return branch.id;
}

export async function getDefaultBranchId(companyId: string): Promise<string> {
  const branch = await ensureDefaultBranchForCompany(companyId);
  return branch.id;
}
