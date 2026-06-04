"use server";

import { CustomerContactRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canManageCustomers } from "@/lib/auth/permissions";
import { branchScopeFromSession, customerWhereFromScope } from "@/lib/branches/scope";
import { requireWritableTenant } from "@/lib/billing/guards";
import { writeAuditEvent } from "@/lib/audit/write-event";
import {
  createCustomerContactSchema,
  deleteCustomerContactSchema,
  updateCustomerContactSchema,
} from "@/lib/customers/contact-schemas";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type CustomerContactActionResult = { ok: true } | { ok: false; error: string };

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

async function guardCustomerContact(customerId: string) {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "Sign in required." };
  if (!canManageCustomers(session.role)) {
    return { ok: false as const, error: "You do not have permission to manage contacts." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false as const, error: tenant.error };

  const scope = branchScopeFromSession(session);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...customerWhereFromScope(scope, session.companyId) },
    select: { id: true },
  });
  if (!customer) return { ok: false as const, error: "Customer not found." };

  return { ok: true as const, session, customerId: customer.id };
}

export async function createCustomerContact(
  _prev: CustomerContactActionResult | undefined,
  formData: FormData,
): Promise<CustomerContactActionResult> {
  const parsed = createCustomerContactSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const guard = await guardCustomerContact(parsed.data.customerId);
  if (!guard.ok) return guard;

  try {
    await prisma.customerContact.create({
      data: {
        customerId: parsed.data.customerId,
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        role: parsed.data.role,
        notes: parsed.data.notes ?? null,
      },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "customer.contact_created",
      entityType: "customer",
      entityId: parsed.data.customerId,
      metadata: { role: parsed.data.role, name: parsed.data.name },
    });
  } catch (error) {
    captureServerActionError("createCustomerContact", error);
    return { ok: false, error: "Could not add contact." };
  }

  revalidatePath(`/dashboard/customers/${parsed.data.customerId}`);
  revalidatePath("/dashboard/customers");
  return { ok: true };
}

export async function updateCustomerContact(
  _prev: CustomerContactActionResult | undefined,
  formData: FormData,
): Promise<CustomerContactActionResult> {
  const parsed = updateCustomerContactSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const contact = await prisma.customerContact.findUnique({
    where: { id: parsed.data.contactId },
    select: { customerId: true },
  });
  if (!contact) return { ok: false, error: "Contact not found." };

  const guard = await guardCustomerContact(contact.customerId);
  if (!guard.ok) return guard;

  try {
    await prisma.customerContact.update({
      where: { id: parsed.data.contactId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        role: parsed.data.role,
        notes: parsed.data.notes ?? null,
      },
    });
  } catch (error) {
    captureServerActionError("updateCustomerContact", error);
    return { ok: false, error: "Could not update contact." };
  }

  revalidatePath(`/dashboard/customers/${contact.customerId}`);
  return { ok: true };
}

export async function deleteCustomerContact(
  _prev: CustomerContactActionResult | undefined,
  formData: FormData,
): Promise<CustomerContactActionResult> {
  const parsed = deleteCustomerContactSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const contact = await prisma.customerContact.findUnique({
    where: { id: parsed.data.contactId },
    select: { customerId: true, name: true },
  });
  if (!contact) return { ok: false, error: "Contact not found." };

  const guard = await guardCustomerContact(contact.customerId);
  if (!guard.ok) return guard;

  try {
    await prisma.customerContact.delete({ where: { id: parsed.data.contactId } });
  } catch (error) {
    captureServerActionError("deleteCustomerContact", error);
    return { ok: false, error: "Could not remove contact." };
  }

  revalidatePath(`/dashboard/customers/${contact.customerId}`);
  return { ok: true };
}

export async function seedBillingContactFromAccountAction(
  _prev: CustomerContactActionResult | undefined,
  formData: FormData,
): Promise<CustomerContactActionResult> {
  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!customerId) return { ok: false, error: "Customer is required." };
  return seedBillingContactFromAccount(customerId);
}

export async function seedBillingContactFromAccount(
  customerId: string,
): Promise<CustomerContactActionResult> {
  const guard = await guardCustomerContact(customerId);
  if (!guard.ok) return guard;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId },
    select: { name: true, email: true, phone: true, contacts: { select: { id: true }, take: 1 } },
  });
  if (!customer) return { ok: false, error: "Customer not found." };
  if (customer.contacts.length > 0) {
    return { ok: false, error: "Contacts already exist for this account." };
  }
  if (!customer.email && !customer.phone) {
    return { ok: false, error: "Add an email or phone on the account first." };
  }

  try {
    await prisma.customerContact.create({
      data: {
        customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: CustomerContactRole.billing,
      },
    });
  } catch (error) {
    captureServerActionError("seedBillingContactFromAccount", error);
    return { ok: false, error: "Could not create contact." };
  }

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { ok: true };
}
