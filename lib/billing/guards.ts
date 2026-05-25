import type { DashboardSession } from "@/lib/dashboard/session";

export async function hasActiveCompanyAccess(
  _session: DashboardSession,
): Promise<boolean> {
  return true;
}

export async function assertActiveCompanyAccess(
  _session: DashboardSession,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: true };
}
