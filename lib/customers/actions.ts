"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { canManageCustomers } from "@/lib/auth/permissions";
import { requireWritableTenant } from "@/lib/billing/guards";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { createCustomerSchema } from "@/lib/customers/schemas";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { canFilterBranchesByCookie } from "@/lib/branches/scope";
import { requiresAssignedBranch } from "@/lib/branches/user-branch";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type CreateCustomerFormState =
  | { ok: true }
  | { ok: false; error: string };

function formDataToObject(formData: FormData): Record<string, string> {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
}

export async function createCustomer(
  _prev: CreateCustomerFormState | undefined,
  formData: FormData,
): Promise<CreateCustomerFormState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageCustomers(session.role)) {
    return { ok: false, error: "You do not have permission to add customers." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = createCustomerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: message };
  }

  let branchId: string;
  if (canFilterBranchesByCookie(session)) {
    const branchIdRaw = String(formData.get("branchId") ?? "").trim();
    let resolved = branchIdRaw || session.activeBranchId || null;
    if (resolved) {
      const branch = await prisma.branch.findFirst({
        where: { id: resolved, companyId: session.companyId },
        select: { id: true },
      });
      if (!branch) resolved = null;
    }
    branchId = resolved ?? (await getDefaultBranchId(session.companyId));
  } else {
    if (!session.userBranchId) {
      return {
        ok: false,
        error: "Your account has no branch assigned. Ask the owner to set your branch in Organization → Team.",
      };
    }
    const branchIdRaw = String(formData.get("branchId") ?? "").trim();
    if (branchIdRaw && branchIdRaw !== session.userBranchId) {
      return {
        ok: false,
        error: "You can only add customers to your assigned branch.",
      };
    }
    branchId = session.userBranchId;
  }

  if (requiresAssignedBranch(session.role) && branchId !== session.userBranchId) {
    return { ok: false, error: "You can only add customers to your assigned branch." };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        companyId: session.companyId,
        branchId,
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
      },
    });

    await writeAuditEvent({
      companyId: session.companyId,
      actorUserId: session.appUserId,
      action: "customer.created",
      entityType: "customer",
      entityId: customer.id,
      metadata: {
        name: customer.name,
      },
    });

    revalidatePath("/dashboard/customers");
    redirect(`/dashboard/customers/${customer.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    captureServerActionError("createCustomer", error);
    return { ok: false, error: "Could not create customer. Please try again." };
  }
}
