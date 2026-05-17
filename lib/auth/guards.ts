import { redirect } from "next/navigation";
import type { AppRole } from "./roles";
import {
  canManageCustomers,
  canManageJobs,
  canManageOrgSettings,
} from "./permissions";

function requireAppRole(role: AppRole | null): asserts role is AppRole {
  if (!role) redirect("/dashboard");
}

export function ensureCanManageJobs(role: AppRole | null): void {
  requireAppRole(role);
  if (!canManageJobs(role)) redirect("/dashboard");
}

export function ensureCanManageCustomers(role: AppRole | null): void {
  requireAppRole(role);
  if (!canManageCustomers(role)) redirect("/dashboard");
}

export function ensureCanManageOrgSettings(role: AppRole | null): void {
  requireAppRole(role);
  if (!canManageOrgSettings(role)) redirect("/dashboard");
}
