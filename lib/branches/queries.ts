import type { DashboardSession } from "@/lib/dashboard/session";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";
import { prisma } from "@/lib/prisma";

export type BranchListItem = {
  id: string;
  name: string;
  isDefault: boolean;
  customerCount: number;
};

export async function listBranchesForCompany(companyId: string): Promise<BranchListItem[]> {
  const rows = await prisma.branch.findMany({
    where: { companyId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      _count: { select: { customers: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    customerCount: row._count.customers,
  }));
}

export async function getBranchSwitcherData(session: DashboardSession) {
  const branches = await listBranchesForCompany(session.companyId);
  const canSwitch = canFilterBranchesByCookie(session) && branches.length > 1;
  return {
    branches,
    canSwitch,
    activeBranchId: session.activeBranchId,
    label:
      session.activeBranchId != null
        ? (branches.find((b) => b.id === session.activeBranchId)?.name ?? "Branch")
        : "All locations",
  };
}

export async function listBranchesForCustomerForm(session: DashboardSession) {
  const branches = await listBranchesForCompany(session.companyId);
  const defaultBranch =
    branches.find((b) => b.isDefault) ?? branches[0] ?? null;
  const preferredId = session.activeBranchId ?? session.userBranchId ?? defaultBranch?.id;
  return { branches, defaultBranchId: preferredId ?? defaultBranch?.id ?? null };
}
