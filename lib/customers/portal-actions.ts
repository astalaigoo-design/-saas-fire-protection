"use server";

import { revalidatePath } from "next/cache";
import { canManageCustomers } from "@/lib/auth/permissions";
import { branchScopeFromSession, customerWhereFromScope } from "@/lib/branches/scope";
import { requireWritableTenant } from "@/lib/billing/guards";
import { ensureCustomerPortalToken } from "@/lib/customers/portal-token";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type PortalActionResult =
  | { ok: true; portalToken: string }
  | { ok: false; error: string };

async function guardCustomer(customerId: string) {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "Sign in required." };
  if (!canManageCustomers(session.role)) {
    return { ok: false as const, error: "You do not have permission to manage portal access." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false as const, error: tenant.error };

  const scope = branchScopeFromSession(session);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...customerWhereFromScope(scope, session.companyId) },
    select: { id: true },
  });
  if (!customer) return { ok: false as const, error: "Customer not found." };

  return { ok: true as const, customerId: customer.id };
}

export async function enableCustomerPortal(customerId: string): Promise<PortalActionResult> {
  const guard = await guardCustomer(customerId);
  if (!guard.ok) return guard;

  try {
    const portalToken = await ensureCustomerPortalToken(guard.customerId);
    revalidatePath(`/dashboard/customers/${guard.customerId}`);
    return { ok: true, portalToken };
  } catch (error) {
    captureServerActionError("enableCustomerPortal", error);
    return { ok: false, error: "Could not enable portal link." };
  }
}

export async function disableCustomerPortal(customerId: string): Promise<PortalActionResult> {
  const guard = await guardCustomer(customerId);
  if (!guard.ok) return guard;

  try {
    await prisma.customer.update({
      where: { id: guard.customerId },
      data: { portalToken: null, portalEnabledAt: null },
    });
    revalidatePath(`/dashboard/customers/${guard.customerId}`);
    return { ok: true, portalToken: "" };
  } catch (error) {
    captureServerActionError("disableCustomerPortal", error);
    return { ok: false, error: "Could not disable portal link." };
  }
}
