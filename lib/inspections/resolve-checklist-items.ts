import { InspectionItemResult } from "@prisma/client";
import type { InspectionChecklistCreateInput } from "@/lib/inspections/build-checklist";
import { ensureChecklistTemplateSeeded } from "@/lib/inspections/checklist-template-seed";
import { prisma } from "@/lib/prisma";

/** Rows copied onto a new inspection (visible template items only). */
export async function resolveInspectionChecklistCreateInputs(
  inspectionTypeId: string,
): Promise<InspectionChecklistCreateInput[]> {
  const inspectionType = await prisma.inspectionType.findUnique({
    where: { id: inspectionTypeId },
    select: { id: true, code: true },
  });
  if (!inspectionType) {
    throw new Error("Inspection type not found.");
  }

  await ensureChecklistTemplateSeeded(inspectionType.id, inspectionType.code);

  const rows = await prisma.checklistTemplateItem.findMany({
    where: { inspectionTypeId, hidden: false },
    orderBy: { sortOrder: "asc" },
    select: { label: true, description: true, sortOrder: true },
  });

  return rows.map((row) => ({
    label: row.label,
    description: row.description ?? "",
    sortOrder: row.sortOrder,
    result: InspectionItemResult.pending,
  }));
}
