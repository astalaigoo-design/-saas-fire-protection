import { OperatingMarket, type Prisma } from "@prisma/client";
import { getDefaultChecklistForMarket } from "@/lib/inspections/checklist-for-market";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

async function resolveOperatingMarketForInspectionType(
  inspectionTypeId: string,
  client: DbClient,
  operatingMarket?: OperatingMarket,
): Promise<OperatingMarket> {
  if (operatingMarket) return operatingMarket;

  const type = await client.inspectionType.findUnique({
    where: { id: inspectionTypeId },
    select: { company: { select: { operatingMarket: true } } },
  });

  return type?.company.operatingMarket ?? OperatingMarket.US;
}

export async function seedChecklistTemplateFromMarket(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  operatingMarket: OperatingMarket,
  client: DbClient = prisma,
): Promise<void> {
  const items = getDefaultChecklistForMarket(inspectionTypeCode, operatingMarket);
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

/** @deprecated Use seedChecklistTemplateFromMarket with OperatingMarket.US */
export async function seedChecklistTemplateFromNfpa(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  client: DbClient = prisma,
): Promise<void> {
  await seedChecklistTemplateFromMarket(
    inspectionTypeId,
    inspectionTypeCode,
    OperatingMarket.US,
    client,
  );
}

/** Create default rows when a type has no template yet (lazy backfill). */
export async function ensureChecklistTemplateSeeded(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  client: DbClient = prisma,
  operatingMarket?: OperatingMarket,
): Promise<void> {
  const existing = await client.checklistTemplateItem.count({
    where: { inspectionTypeId },
  });
  if (existing > 0) return;

  const market = await resolveOperatingMarketForInspectionType(
    inspectionTypeId,
    client,
    operatingMarket,
  );
  await seedChecklistTemplateFromMarket(
    inspectionTypeId,
    inspectionTypeCode,
    market,
    client,
  );
}

export async function replaceChecklistTemplateWithDefaults(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  operatingMarket: OperatingMarket,
  client: DbClient = prisma,
): Promise<void> {
  await client.checklistTemplateItem.deleteMany({ where: { inspectionTypeId } });
  await seedChecklistTemplateFromMarket(
    inspectionTypeId,
    inspectionTypeCode,
    operatingMarket,
    client,
  );
}

/** @deprecated Use replaceChecklistTemplateWithDefaults */
export async function replaceChecklistTemplateWithNfpa(
  inspectionTypeId: string,
  inspectionTypeCode: string,
  client: DbClient = prisma,
): Promise<void> {
  await replaceChecklistTemplateWithDefaults(
    inspectionTypeId,
    inspectionTypeCode,
    OperatingMarket.US,
    client,
  );
}
