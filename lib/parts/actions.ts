"use server";

import { revalidatePath } from "next/cache";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { requireWritableTenant } from "@/lib/billing/guards";
import {
  adjustPartStockSchema,
  createPartSchema,
  updatePartSchema,
} from "@/lib/parts/schemas";
import { getPartInCompany } from "@/lib/parts/queries";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type PartActionResult = { ok: true } | { ok: false; error: string };

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

async function guardWritable() {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "Sign in required." };
  ensureCanManageJobs(session.role);
  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false as const, error: tenant.error };
  return { ok: true as const, session };
}

export async function createPart(
  _prev: PartActionResult,
  formData: FormData,
): Promise<PartActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = createPartSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.unitCents === "invalid" || parsed.data.quantityOnHand === "invalid") {
    return { ok: false, error: "Unit price and quantity must be whole numbers ≥ 0." };
  }

  try {
    const part = await prisma.part.create({
      data: {
        companyId: guard.session.companyId,
        sku: parsed.data.sku,
        name: parsed.data.name,
        description: parsed.data.description || null,
        unitCents: parsed.data.unitCents,
        quantityOnHand: parsed.data.quantityOnHand,
      },
      select: { id: true },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "part.created",
      entityType: "part",
      entityId: part.id,
      metadata: { sku: parsed.data.sku },
    });

    revalidatePath("/dashboard/parts");
    return { ok: true };
  } catch (error) {
    captureServerActionError("createPart", error);
    return { ok: false, error: "Could not add part. SKU may already exist." };
  }
}

export async function updatePart(
  _prev: PartActionResult,
  formData: FormData,
): Promise<PartActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = updatePartSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.unitCents === "invalid" || parsed.data.quantityOnHand === "invalid") {
    return { ok: false, error: "Unit price and quantity must be whole numbers ≥ 0." };
  }

  const existing = await getPartInCompany(guard.session, parsed.data.partId);
  if (!existing) return { ok: false, error: "Part not found." };

  try {
    await prisma.part.update({
      where: { id: existing.id },
      data: {
        sku: parsed.data.sku,
        name: parsed.data.name,
        description: parsed.data.description || null,
        unitCents: parsed.data.unitCents,
        quantityOnHand: parsed.data.quantityOnHand,
      },
    });

    revalidatePath("/dashboard/parts");
    return { ok: true };
  } catch (error) {
    captureServerActionError("updatePart", error);
    return { ok: false, error: "Could not update part." };
  }
}

export async function adjustPartStock(
  _prev: PartActionResult,
  formData: FormData,
): Promise<PartActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = adjustPartStockSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.delta === "invalid") {
    return { ok: false, error: "Enter a whole number to adjust stock." };
  }

  const existing = await getPartInCompany(guard.session, parsed.data.partId);
  if (!existing) return { ok: false, error: "Part not found." };

  const nextQty = existing.quantityOnHand + parsed.data.delta;
  if (nextQty < 0) {
    return { ok: false, error: "Stock cannot go below zero." };
  }

  try {
    await prisma.part.update({
      where: { id: existing.id },
      data: { quantityOnHand: nextQty },
    });
    revalidatePath("/dashboard/parts");
    revalidatePath("/dashboard/work-orders");
    return { ok: true };
  } catch (error) {
    captureServerActionError("adjustPartStock", error);
    return { ok: false, error: "Could not adjust stock." };
  }
}
