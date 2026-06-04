"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { canManageCustomers } from "@/lib/auth/permissions";
import { branchScopeFromSession, customerWhereFromScope } from "@/lib/branches/scope";
import { requireWritableTenant } from "@/lib/billing/guards";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { mergeCustomersSchema } from "@/lib/customers/contact-schemas";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type MergeCustomersResult = { ok: true } | { ok: false; error: string };

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

export async function mergeCustomers(
  _prev: MergeCustomersResult | undefined,
  formData: FormData,
): Promise<MergeCustomersResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  if (!canManageCustomers(session.role)) {
    return { ok: false, error: "You do not have permission to merge customers." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = mergeCustomersSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.sourceCustomerId === parsed.data.targetCustomerId) {
    return { ok: false, error: "Choose two different customers." };
  }

  const scope = branchScopeFromSession(session);
  const where = customerWhereFromScope(scope, session.companyId);

  const [source, target] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: parsed.data.sourceCustomerId, ...where },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        branchId: true,
        portalToken: true,
        _count: { select: { buildings: true, contacts: true } },
        contacts: true,
      },
    }),
    prisma.customer.findFirst({
      where: { id: parsed.data.targetCustomerId, ...where },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        portalToken: true,
      },
    }),
  ]);

  if (!source || !target) {
    return { ok: false, error: "One or both customers were not found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.building.updateMany({
        where: { customerId: source.id },
        data: { customerId: target.id },
      });

      for (const contact of source.contacts) {
        const duplicate = await tx.customerContact.findFirst({
          where: {
            customerId: target.id,
            role: contact.role,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
          },
        });
        if (!duplicate) {
          await tx.customerContact.create({
            data: {
              customerId: target.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              role: contact.role,
              notes: contact.notes,
            },
          });
        }
      }

      const targetUpdates: {
        email?: string | null;
        phone?: string | null;
        portalToken?: string | null;
        portalEnabledAt?: Date | null;
      } = {};

      if (!target.email && source.email) targetUpdates.email = source.email;
      if (!target.phone && source.phone) targetUpdates.phone = source.phone;
      if (!target.portalToken && source.portalToken) {
        targetUpdates.portalToken = source.portalToken;
        targetUpdates.portalEnabledAt = new Date();
      }

      if (Object.keys(targetUpdates).length > 0) {
        await tx.customer.update({
          where: { id: target.id },
          data: targetUpdates,
        });
      }

      await tx.customer.delete({ where: { id: source.id } });
    });

    await writeAuditEvent({
      companyId: session.companyId,
      actorUserId: session.appUserId,
      action: "customer.merged",
      entityType: "customer",
      entityId: target.id,
      metadata: {
        sourceCustomerId: source.id,
        sourceName: source.name,
        targetName: target.name,
        buildingsMoved: source._count.buildings,
        contactsMoved: source._count.contacts,
      },
    });
  } catch (error) {
    captureServerActionError("mergeCustomers", error);
    return { ok: false, error: "Could not merge customers." };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/buildings");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");

  try {
    redirect(`/dashboard/customers/${target.id}?merged=1`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: "Merge completed but redirect failed." };
  }
}
