import type { DashboardSession } from "@/lib/dashboard/session";
import {
  INSPECTION_TYPE_TEMPLATES,
  NFPA_PACK_TEMPLATES,
  type InspectionTypeTemplate,
} from "@/lib/inspections/inspection-type-templates";
import { prisma } from "@/lib/prisma";

export type InspectionTypePackRow = InspectionTypeTemplate & {
  enabled: boolean;
  inspectionTypeId: string | null;
};

export type InspectionTypePacksData = {
  packs: InspectionTypePackRow[];
};

export async function getInspectionTypePacksData(
  session: DashboardSession,
): Promise<InspectionTypePacksData> {
  const enabledTypes = await prisma.inspectionType.findMany({
    where: { companyId: session.companyId },
    select: { id: true, code: true },
  });
  const enabledByCode = new Map(enabledTypes.map((row) => [row.code, row.id]));

  const packOrder = NFPA_PACK_TEMPLATES.map((template) => template.code);

  const packs: InspectionTypePackRow[] = NFPA_PACK_TEMPLATES.map((template) => {
    const inspectionTypeId = enabledByCode.get(template.code) ?? null;
    return {
      ...template,
      enabled: inspectionTypeId !== null,
      inspectionTypeId,
    };
  }).sort(
    (left, right) => packOrder.indexOf(left.code) - packOrder.indexOf(right.code),
  );

  return { packs };
}

/** All templates with enabled state (cadence + packs) for internal tooling. */
export async function getInspectionTypeTemplatesStatus(companyId: string) {
  const enabledTypes = await prisma.inspectionType.findMany({
    where: { companyId },
    select: { id: true, code: true },
  });
  const enabledByCode = new Map(enabledTypes.map((row) => [row.code, row.id]));

  return INSPECTION_TYPE_TEMPLATES.map((template) => ({
    ...template,
    enabled: enabledByCode.has(template.code),
    inspectionTypeId: enabledByCode.get(template.code) ?? null,
  }));
}
