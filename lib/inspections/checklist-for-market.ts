import { OperatingMarket } from "@prisma/client";
import type { ChecklistTemplateItem } from "@/lib/inspections/checklist-item";
import { getNfpaChecklistForInspectionTypeCode } from "@/lib/inspections/nfpa-checklists";
import { getUkChecklistForInspectionTypeCode } from "@/lib/inspections/uk-checklists";

/** Default checklist rows for an inspection type code in the tenant's operating market. */
export function getDefaultChecklistForMarket(
  inspectionTypeCode: string,
  market: OperatingMarket,
): readonly ChecklistTemplateItem[] {
  if (market === OperatingMarket.UK) {
    return getUkChecklistForInspectionTypeCode(inspectionTypeCode);
  }
  return getNfpaChecklistForInspectionTypeCode(inspectionTypeCode);
}
