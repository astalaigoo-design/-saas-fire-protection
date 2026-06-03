import { canAccessInspectionInScope } from "@/lib/branches/assert-access";
import { getDashboardSession, type DashboardSession } from "@/lib/dashboard/session";

export async function getInspectSession(): Promise<DashboardSession | null> {
  return getDashboardSession();
}

export async function canAccessInspection(
  session: DashboardSession,
  inspectionId: string,
): Promise<boolean> {
  return canAccessInspectionInScope(session, inspectionId);
}
