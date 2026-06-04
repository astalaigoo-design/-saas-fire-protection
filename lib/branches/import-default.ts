import type { DashboardSession } from "@/lib/dashboard/session";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";

export type BranchImportDefaultRow = {
  id: string;
  isDefault: boolean;
  isImportDefault: boolean;
};

/** Branch used when CSV rows omit the branch column. */
export function resolveImportDefaultBranchId(
  session: DashboardSession,
  branches: BranchImportDefaultRow[],
  companyFallbackBranchId: string,
): string {
  if (canFilterBranchesByCookie(session) && session.activeBranchId) {
    const active = branches.find((b) => b.id === session.activeBranchId);
    if (active) return active.id;
  }

  if (session.userBranchId) {
    return session.userBranchId;
  }

  const importDefault = branches.find((b) => b.isImportDefault);
  if (importDefault) return importDefault.id;

  const companyDefault = branches.find((b) => b.isDefault);
  if (companyDefault) return companyDefault.id;

  return branches[0]?.id ?? companyFallbackBranchId;
}
