import type { DashboardSession } from "@/lib/dashboard/session";
import { ensureChecklistTemplateSeeded } from "@/lib/inspections/checklist-template-seed";
import { prisma } from "@/lib/prisma";

export type ChecklistTemplateItemRow = {
  id: string;
  label: string;
  description: string | null;
  linkedTagNumber: string | null;
  sortOrder: number;
  hidden: boolean;
};

export type ChecklistTemplateTypeRow = {
  id: string;
  code: string;
  name: string;
  items: ChecklistTemplateItemRow[];
};

export type ChecklistTemplatesEditorData = {
  types: ChecklistTemplateTypeRow[];
};

export async function getChecklistTemplatesEditorData(
  session: DashboardSession,
): Promise<ChecklistTemplatesEditorData> {
  const types = await prisma.inspectionType.findMany({
    where: { companyId: session.companyId },
    orderBy: [{ code: "asc" }],
    select: { id: true, code: true, name: true },
  });

  for (const type of types) {
    await ensureChecklistTemplateSeeded(type.id, type.code);
  }

  const typeIds = types.map((type) => type.id);
  const items =
    typeIds.length === 0
      ? []
      : await prisma.checklistTemplateItem.findMany({
          where: { inspectionTypeId: { in: typeIds } },
          orderBy: [{ sortOrder: "asc" }],
          select: {
            id: true,
            inspectionTypeId: true,
            label: true,
            description: true,
            linkedTagNumber: true,
            sortOrder: true,
            hidden: true,
          },
        });

  const itemsByTypeId = new Map<string, ChecklistTemplateItemRow[]>();
  for (const item of items) {
    const list = itemsByTypeId.get(item.inspectionTypeId) ?? [];
    list.push({
      id: item.id,
      label: item.label,
      description: item.description,
      linkedTagNumber: item.linkedTagNumber,
      sortOrder: item.sortOrder,
      hidden: item.hidden,
    });
    itemsByTypeId.set(item.inspectionTypeId, list);
  }

  return {
    types: types.map((type) => ({
      id: type.id,
      code: type.code,
      name: type.name,
      items: itemsByTypeId.get(type.id) ?? [],
    })),
  };
}
