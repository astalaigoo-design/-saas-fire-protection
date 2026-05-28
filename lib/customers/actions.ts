"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { canManageCustomers } from "@/lib/auth/permissions";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { createCustomerSchema } from "@/lib/customers/schemas";
import { getDashboardSession } from "@/lib/dashboard/session";
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

  const parsed = createCustomerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: message };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        companyId: session.companyId,
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
    console.error("createCustomer failed", error);
    return { ok: false, error: "Could not create customer. Please try again." };
  }
}
