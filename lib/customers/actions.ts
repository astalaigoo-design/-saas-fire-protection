"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { canManageCustomers } from "@/lib/auth/permissions";
import { requireWritableTenant } from "@/lib/billing/guards";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { CustomerContactRole } from "@prisma/client";
import { createCustomerSchema } from "@/lib/customers/schemas";
import { reassignCustomerBranchSchema } from "@/lib/customers/reassign-branch-schema";
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
        ...(parsed.data.email || parsed.data.phone
          ? {
              contacts: {
                create: {
                  name: parsed.data.name,
                  email: parsed.data.email ?? null,
                  phone: parsed.data.phone ?? null,
                  role: CustomerContactRole.billing,
                },
              },
            }
          : {}),
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

export type ReassignCustomerBranchState =
  | { ok: true; branchName: string }
  | { ok: false; error: string };

export async function reassignCustomerBranch(
  _prev: ReassignCustomerBranchState | undefined,
  formData: FormData,
): Promise<ReassignCustomerBranchState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageCustomers(session.role)) {
    return { ok: false, error: "You do not have permission to update customers." };
  }
  if (!canFilterBranchesByCookie(session)) {
    return { ok: false, error: "Only the owner can move customers between branches." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = reassignCustomerBranchSchema.safeParse({
    customerId: formData.get("customerId"),
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, companyId: session.companyId },
    select: { id: true, name: true, branchId: true },
  });
  if (!customer) {
    return { ok: false, error: "Customer not found." };
  }

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, companyId: session.companyId },
    select: { id: true, name: true },
  });
  if (!branch) {
    return { ok: false, error: "Choose a valid branch." };
  }

  if (customer.branchId === branch.id) {
    return { ok: true, branchName: branch.name };
  }

  try {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { branchId: branch.id },
    });

    await writeAuditEvent({
      companyId: session.companyId,
      actorUserId: session.appUserId,
      action: "customer.branch_reassigned",
      entityType: "customer",
      entityId: customer.id,
      metadata: {
        name: customer.name,
        fromBranchId: customer.branchId,
        toBranchId: branch.id,
        branchName: branch.name,
      },
    });
  } catch (error) {
    captureServerActionError("reassignCustomerBranch", error);
    return { ok: false, error: "Could not update branch. Try again." };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customer.id}`);
  revalidatePath("/dashboard/buildings");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { ok: true, branchName: branch.name };
}
