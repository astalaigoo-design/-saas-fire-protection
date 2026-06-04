import type { Prisma } from "@prisma/client";
import { getNfpaChecklistForInspectionTypeCode } from "@/lib/inspections/nfpa-checklists";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function seedChecklistTemplateFromNfpa(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  client: DbClient = prisma,
): Promise<void> {
  const items = getNfpaChecklistForInspectionTypeCode(inspectionTypeCode);
  await client.checklistTemplateItem.createMany({
    data: items.map((item, index) => ({
      inspectionTypeId,
      label: item.label,
      description: item.description,
      sortOrder: index,
      hidden: false,
    })),
  });
}

/** Create NFPA default rows when a type has no template yet (lazy backfill). */
export async function ensureChecklistTemplateSeeded(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  client: DbClient = prisma,
): Promise<void> {
  const existing = await client.checklistTemplateItem.count({
    where: { inspectionTypeId },
  });
  if (existing > 0) return;
  await seedChecklistTemplateFromNfpa(inspectionTypeId, inspectionTypeCode, client);
}

export async function replaceChecklistTemplateWithNfpa(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  client: DbClient = prisma,
): Promise<void> {
  await client.checklistTemplateItem.deleteMany({ where: { inspectionTypeId } });
  await seedChecklistTemplateFromNfpa(inspectionTypeId, inspectionTypeCode, client);
}
