"use server";

import { revalidatePath } from "next/cache";
import { WorkOrderStatus } from "@prisma/client";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getPartInCompany } from "@/lib/parts/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import { completeWorkOrder } from "@/lib/work-orders/complete-work-order";
import {
  addWorkOrderPartLineSchema,
  removeWorkOrderPartLineSchema,
  technicianWorkOrderIdSchema,
  technicianWorkOrderNotesSchema,
} from "@/lib/work-orders/schemas";
import {
  canTechnicianCompleteWorkOrder,
  canTechnicianStartWorkOrder,
  getTechnicianAssignedWorkOrder,
  isTechnicianWorkOrderEditable,
} from "@/lib/work-orders/technician-access";
import type { WorkOrderActionResult } from "@/lib/work-orders/actions";

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

async function guardTechnicianWorkOrder(workOrderId: string) {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "Sign in required." };
  if (session.role !== "technician") {
    return { ok: false as const, error: "Technicians only." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false as const, error: tenant.error };

  const workOrder = await getTechnicianAssignedWorkOrder(session, workOrderId);
  if (!workOrder) {
    return { ok: false as const, error: "Work order not found or not assigned to you." };
  }

  return { ok: true as const, session, workOrder };
}

function revalidateTechnicianWorkOrderPaths(buildingId: string, workOrderId: string) {
  revalidatePath("/dashboard/my-jobs");
  revalidatePath(`/dashboard/work-orders/${workOrderId}`);
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  revalidatePath("/dashboard/operations");
}

export async function startTechnicianWorkOrder(
  _prev: WorkOrderActionResult | undefined,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const parsed = technicianWorkOrderIdSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const guard = await guardTechnicianWorkOrder(parsed.data.workOrderId);
  if (!guard.ok) return guard;

  if (!canTechnicianStartWorkOrder(guard.workOrder.status)) {
    return { ok: false, error: "This work order cannot be started." };
  }

  try {
    await prisma.workOrder.update({
      where: { id: guard.workOrder.id },
      data: { status: WorkOrderStatus.in_progress },
    });

    revalidateTechnicianWorkOrderPaths(guard.workOrder.buildingId, guard.workOrder.id);
    return { ok: true };
  } catch (error) {
    captureServerActionError("startTechnicianWorkOrder", error);
    return { ok: false, error: "Could not start work order." };
  }
}

export async function updateTechnicianWorkOrderNotes(
  _prev: WorkOrderActionResult | undefined,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const parsed = technicianWorkOrderNotesSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const guard = await guardTechnicianWorkOrder(parsed.data.workOrderId);
  if (!guard.ok) return guard;

  if (!isTechnicianWorkOrderEditable(guard.workOrder.status)) {
    return { ok: false, error: "This work order is closed." };
  }

  try {
    await prisma.workOrder.update({
      where: { id: guard.workOrder.id },
      data: { notes: parsed.data.notes || null },
    });

    revalidateTechnicianWorkOrderPaths(guard.workOrder.buildingId, guard.workOrder.id);
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateTechnicianWorkOrderNotes", error);
    return { ok: false, error: "Could not save notes." };
  }
}

export async function completeTechnicianWorkOrder(
  _prev: WorkOrderActionResult | undefined,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const parsed = technicianWorkOrderIdSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const guard = await guardTechnicianWorkOrder(parsed.data.workOrderId);
  if (!guard.ok) return guard;

  if (!canTechnicianCompleteWorkOrder(guard.workOrder.status)) {
    return { ok: false, error: "Start the work order before marking it complete." };
  }

  const result = await completeWorkOrder(guard.workOrder.id);
  if (!result.ok) return result;

  revalidateTechnicianWorkOrderPaths(guard.workOrder.buildingId, guard.workOrder.id);
  revalidatePath("/dashboard/parts");
  return { ok: true };
}

export async function addTechnicianWorkOrderPartLine(
  _prev: WorkOrderActionResult | undefined,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const guardSession = await getDashboardSession();
  if (!guardSession || guardSession.role !== "technician") {
    return { ok: false, error: "Technicians only." };
  }

  const parsed = addWorkOrderPartLineSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.quantity === "invalid" || parsed.data.unitCents === "invalid") {
    return { ok: false, error: "Quantity and unit price must be valid whole numbers." };
  }

  const guard = await guardTechnicianWorkOrder(parsed.data.workOrderId);
  if (!guard.ok) return guard;

  if (!isTechnicianWorkOrderEditable(guard.workOrder.status)) {
    return { ok: false, error: "Cannot add parts to a closed work order." };
  }

  const workOrder = await prisma.workOrder.findFirst({
    where: { id: guard.workOrder.id },
    select: { partLines: { select: { sortOrder: true } } },
  });
  if (!workOrder) return { ok: false, error: "Work order not found." };

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
        workOrderId: guard.workOrder.id,
        partId,
        label,
        quantity: parsed.data.quantity,
        unitCents,
        sortOrder,
      },
    });

    revalidateTechnicianWorkOrderPaths(guard.workOrder.buildingId, guard.workOrder.id);
    return { ok: true };
  } catch (error) {
    captureServerActionError("addTechnicianWorkOrderPartLine", error);
    return { ok: false, error: "Could not add part line." };
  }
}

export async function removeTechnicianWorkOrderPartLine(
  _prev: WorkOrderActionResult | undefined,
  formData: FormData,
): Promise<WorkOrderActionResult> {
  const parsed = removeWorkOrderPartLineSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const guard = await guardTechnicianWorkOrder(parsed.data.workOrderId);
  if (!guard.ok) return guard;

  if (!isTechnicianWorkOrderEditable(guard.workOrder.status)) {
    return { ok: false, error: "Cannot edit parts on a closed work order." };
  }

  try {
    await prisma.workOrderPartLine.deleteMany({
      where: { id: parsed.data.lineId, workOrderId: guard.workOrder.id },
    });

    revalidateTechnicianWorkOrderPaths(guard.workOrder.buildingId, guard.workOrder.id);
    return { ok: true };
  } catch (error) {
    captureServerActionError("removeTechnicianWorkOrderPartLine", error);
    return { ok: false, error: "Could not remove line." };
  }
}
