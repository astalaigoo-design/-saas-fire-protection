import { WorkOrderStatus, type Prisma } from "@prisma/client";
import { applyWorkOrderAssetServiceOnComplete } from "@/lib/work-orders/asset-service-on-complete";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import {
  validateWorkOrderPartStock,
  type WorkOrderPartSnapshot,
  type WorkOrderPartStockLine,
} from "@/lib/work-orders/part-stock-validation";

type PartLineDb = Pick<WorkOrderPartStockLine, "partId" | "quantity" | "label">;

async function loadPartsByIdForLines(
  lines: PartLineDb[],
  db: Prisma.TransactionClient | typeof prisma,
): Promise<Map<string, WorkOrderPartSnapshot>> {
  const partsById = new Map<string, WorkOrderPartSnapshot>();
  for (const line of lines) {
    if (!line.partId || partsById.has(line.partId)) continue;
    const part = await db.part.findUnique({
      where: { id: line.partId },
      select: { quantityOnHand: true, sku: true },
    });
    if (part) partsById.set(line.partId, part);
  }
  return partsById;
}

async function decrementInventoryForLines(
  workOrderId: string,
  tx: Prisma.TransactionClient,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const lines = await tx.workOrderPartLine.findMany({
    where: { workOrderId, partId: { not: null } },
    select: { partId: true, quantity: true, label: true },
  });

  const partsById = await loadPartsByIdForLines(lines, tx);
  const stock = validateWorkOrderPartStock(lines, partsById);
  if (!stock.ok) return stock;

  for (const line of lines) {
    if (!line.partId) continue;
    await tx.part.update({
      where: { id: line.partId },
      data: { quantityOnHand: { decrement: line.quantity } },
    });
  }

  return { ok: true };
}

export async function completeWorkOrder(
  workOrderId: string,
  options?: { requireInProgress?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const requireInProgress = options?.requireInProgress ?? true;
  const existing = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true, status: true, buildingId: true },
  });

  if (!existing) {
    return { ok: false, error: "Work order not found." };
  }

  if (
    existing.status === WorkOrderStatus.completed ||
    existing.status === WorkOrderStatus.cancelled
  ) {
    return { ok: false, error: "This work order is already closed." };
  }

  if (requireInProgress && existing.status !== WorkOrderStatus.in_progress) {
    return { ok: false, error: "Start the work order before marking it complete." };
  }

  const lines = await prisma.workOrderPartLine.findMany({
    where: { workOrderId: existing.id, partId: { not: null } },
    select: { partId: true, quantity: true, label: true },
  });

  const partsById = await loadPartsByIdForLines(lines, prisma);
  const preCheck = validateWorkOrderPartStock(lines, partsById);
  if (!preCheck.ok) return preCheck;

  try {
    await prisma.$transaction(async (tx) => {
      const stock = await decrementInventoryForLines(existing.id, tx);
      if (!stock.ok) throw new Error("STOCK");

      await tx.workOrder.update({
        where: { id: existing.id },
        data: {
          status: WorkOrderStatus.completed,
          completedAt: new Date(),
        },
      });
    });

    try {
      await applyWorkOrderAssetServiceOnComplete(existing.id);
    } catch (error) {
      captureServerActionError("applyWorkOrderAssetServiceOnComplete", error);
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK") {
      return { ok: false, error: "Insufficient stock to complete work order." };
    }
    captureServerActionError("completeWorkOrder", error);
    return { ok: false, error: "Could not complete work order." };
  }
}
