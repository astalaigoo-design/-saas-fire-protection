export type WorkOrderPartStockLine = {
  partId: string | null;
  quantity: number;
  label: string;
};

export type WorkOrderPartSnapshot = {
  quantityOnHand: number;
  sku: string;
};

export function validateWorkOrderPartStock(
  lines: WorkOrderPartStockLine[],
  partsById: ReadonlyMap<string, WorkOrderPartSnapshot>,
): { ok: true } | { ok: false; error: string } {
  for (const line of lines) {
    if (!line.partId) continue;
    const part = partsById.get(line.partId);
    if (!part) continue;
    if (part.quantityOnHand < line.quantity) {
      return {
        ok: false,
        error: `Insufficient stock for ${part.sku} (need ${line.quantity}, have ${part.quantityOnHand}).`,
      };
    }
  }

  return { ok: true };
}
