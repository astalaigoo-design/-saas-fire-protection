"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { WorkOrderStatus, type Prisma } from "@prisma/client";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { canViewAssignedJobs } from "@/lib/auth/permissions";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getBuildingById } from "@/lib/buildings/queries";
import { getPartInCompany } from "@/lib/parts/queries";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseDateInputValue } from "@/lib/scheduling/calendar";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import {
  addWorkOrderPartLineSchema,
  createWorkOrderSchema,
  removeWorkOrderPartLineSchema,
  updateWorkOrderSchema,
} from "@/lib/work-orders/schemas";
import { getWorkOrderById } from "@/lib/work-orders/queries";

export type WorkOrderActionResult = { ok: true } | { ok: false; error: string };

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
  if (!canViewAssignedJobs(session.role)) {
    return { ok: false as const, error: "You do not have permission." };
  }
  ensureCanManageJobs(session.role);
  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false as const, error: tenant.error };
  return { ok: true as const, session };
}

function parseOptionalDate(value: string | undefined): Date | null | "invalid" {
  if (!value) return null;
  const parsed = parseDateInputValue(value);
  if (!parsed) return "invalid";
  return parsed;
}

async function decrementInventoryForLines(
  workOrderId: string,
  tx: Prisma.TransactionClient,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const lines = await tx.workOrderPartLine.findMany({
    where: { workOrderId, partId: { not: null } },
    select: { partId: true, quantity: true, label: true },
  });

  for (const line of lines) {
    if (!line.partId) continue;
    const part = await tx.part.findUnique({
      where: { id: line.partId },
      select: { quantityOnHand: true, sku: true },
    });
    if (!part) continue;
    if (part.quantityOnHand < line.quantity) {
      return {
        ok: false,
        error: `Insufficient stock for ${part.sku} (need ${line.quantity}, have ${part.quantityOnHand}).`,
      };
    }
    await tx.part.update({
      where: { id: line.partId },
      data: { quantityOnHand: { decrement: line.quantity } },
    });
  }

  return { ok: true };
}

export async function createWorkOrder(
  _prev: WorkOrderActionResult,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = createWorkOrderSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const building = await getBuildingById(guard.session, parsed.data.buildingId);
  if (!building) return { ok: false, error: "Building not found." };

  const scheduledAt = parseOptionalDate(parsed.data.scheduledAt);
  if (scheduledAt === "invalid") {
    return { ok: false, error: "Enter a valid scheduled date (YYYY-MM-DD)." };
  }

  try {
    const workOrder = await prisma.workOrder.create({
      data: {
        companyId: guard.session.companyId,
        buildingId: building.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        deficiencyId: parsed.data.deficiencyId || null,
        quoteId: parsed.data.quoteId || null,
        assignedToUserId: parsed.data.assignedToUserId || null,
        scheduledAt,
        notes: parsed.data.notes || null,
        status: scheduledAt ? WorkOrderStatus.scheduled : WorkOrderStatus.draft,
      },
      select: { id: true },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "work_order.created",
      entityType: "work_order",
      entityId: workOrder.id,
      metadata: { buildingId: building.id, title: parsed.data.title },
    });

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard/operations");
    redirect(`/dashboard/work-orders/${workOrder.id}`);
  } catch (error) {
    captureServerActionError("createWorkOrder", error);
    return { ok: false, error: "Could not create work order." };
  }
}

export async function createWorkOrderFromDeficiency(
  deficiencyId: string,
): Promise<WorkOrderActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const deficiency = await prisma.deficiency.findFirst({
    where: { id: deficiencyId, companyId: guard.session.companyId },
    select: {
      id: true,
      label: true,
      buildingId: true,
      sourceInspection: { select: { quote: { select: { id: true } } } },
    },
  });
  if (!deficiency) return { ok: false, error: "Deficiency not found." };

  const building = await getBuildingById(guard.session, deficiency.buildingId);
  if (!building) return { ok: false, error: "Building not found." };

  try {
    const workOrder = await prisma.workOrder.create({
      data: {
        companyId: guard.session.companyId,
        buildingId: deficiency.buildingId,
        title: `Repair: ${deficiency.label}`,
        deficiencyId: deficiency.id,
        quoteId: deficiency.sourceInspection.quote?.id ?? null,
        status: WorkOrderStatus.draft,
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard/operations");
    redirect(`/dashboard/work-orders/${workOrder.id}`);
  } catch (error) {
    captureServerActionError("createWorkOrderFromDeficiency", error);
    return { ok: false, error: "Could not create work order." };
  }
}

export async function updateWorkOrder(
  _prev: WorkOrderActionResult,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = updateWorkOrderSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getWorkOrderById(guard.session, parsed.data.workOrderId);
  if (!existing) return { ok: false, error: "Work order not found." };
  if (existing.status === WorkOrderStatus.completed || existing.status === WorkOrderStatus.cancelled) {
    return { ok: false, error: "Completed or cancelled work orders cannot be edited." };
  }

  const scheduledAt = parseOptionalDate(parsed.data.scheduledAt);
  if (scheduledAt === "invalid") {
    return { ok: false, error: "Enter a valid scheduled date (YYYY-MM-DD)." };
  }

  const completing = parsed.data.status === WorkOrderStatus.completed;

  try {
    if (completing) {
      const lines = await prisma.workOrderPartLine.findMany({
        where: { workOrderId: existing.id, partId: { not: null } },
        select: { partId: true, quantity: true },
      });
      for (const line of lines) {
        if (!line.partId) continue;
        const part = await prisma.part.findUnique({
          where: { id: line.partId },
          select: { quantityOnHand: true, sku: true },
        });
        if (part && part.quantityOnHand < line.quantity) {
          return {
            ok: false,
            error: `Insufficient stock for ${part.sku} (need ${line.quantity}, have ${part.quantityOnHand}).`,
          };
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (completing) {
        const stock = await decrementInventoryForLines(existing.id, tx);
        if (!stock.ok) throw new Error("STOCK");
      }

      await tx.workOrder.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description || null,
          status: parsed.data.status,
          assignedToUserId: parsed.data.assignedToUserId || null,
          scheduledAt,
          notes: parsed.data.notes || null,
          completedAt: completing ? new Date() : undefined,
        },
      });
    });

    revalidatePath(`/dashboard/work-orders/${existing.id}`);
    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard/parts");
    revalidatePath("/dashboard/operations");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK") {
      return { ok: false, error: "Insufficient stock to complete work order." };
    }
    captureServerActionError("updateWorkOrder", error);
    return { ok: false, error: "Could not update work order." };
  }
}

export async function addWorkOrderPartLine(
  _prev: WorkOrderActionResult,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = addWorkOrderPartLineSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.quantity === "invalid" || parsed.data.unitCents === "invalid") {
    return { ok: false, error: "Quantity and unit price must be valid whole numbers." };
  }

  const workOrder = await getWorkOrderById(guard.session, parsed.data.workOrderId);
  if (!workOrder) return { ok: false, error: "Work order not found." };
  if (workOrder.status === WorkOrderStatus.completed || workOrder.status === WorkOrderStatus.cancelled) {
    return { ok: false, error: "Cannot edit lines on a closed work order." };
  }

  let label = parsed.data.label;
  let unitCents = parsed.data.unitCents;
  let partId: string | null = parsed.data.partId || null;

  if (partId) {
    const part = await getPartInCompany(guard.session, partId);
    if (!part) return { ok: false, error: "Part not found." };
    if (!label) label = part.name;
    if (unitCents === 0) unitCents = part.unitCents;
  }

  const sortOrder = workOrder.partLines.length;

  try {
    await prisma.workOrderPartLine.create({
      data: {
        workOrderId: workOrder.id,
        partId,
        label,
        quantity: parsed.data.quantity,
        unitCents,
        sortOrder,
      },
    });

    revalidatePath(`/dashboard/work-orders/${workOrder.id}`);
    return { ok: true };
  } catch (error) {
    captureServerActionError("addWorkOrderPartLine", error);
    return { ok: false, error: "Could not add part line." };
  }
}

export async function removeWorkOrderPartLine(
  _prev: WorkOrderActionResult,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = removeWorkOrderPartLineSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const workOrder = await getWorkOrderById(guard.session, parsed.data.workOrderId);
  if (!workOrder) return { ok: false, error: "Work order not found." };
  if (workOrder.status === WorkOrderStatus.completed || workOrder.status === WorkOrderStatus.cancelled) {
    return { ok: false, error: "Cannot edit lines on a closed work order." };
  }

  try {
    await prisma.workOrderPartLine.deleteMany({
      where: { id: parsed.data.lineId, workOrderId: workOrder.id },
    });
    revalidatePath(`/dashboard/work-orders/${workOrder.id}`);
    return { ok: true };
  } catch (error) {
    captureServerActionError("removeWorkOrderPartLine", error);
    return { ok: false, error: "Could not remove line." };
  }
}
