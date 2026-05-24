import { InspectionItemResult } from "@prisma/client";
import { getNfpaChecklistForInspectionTypeCode } from "@/lib/inspections/nfpa-checklists";

export type InspectionChecklistCreateInput = {
  label: string;
  description: string;
  sortOrder: number;
  result: InspectionItemResult;
};

/** Build draft inspection checklist rows with exact NFPA rule citations. */
export function buildInspectionChecklistItems(
  inspectionTypeCode: string,
): InspectionChecklistCreateInput[] {
  return getNfpaChecklistForInspectionTypeCode(inspectionTypeCode).map(
    (item, index) => ({
      label: item.label,
      description: item.description,
      sortOrder: index,
      result: InspectionItemResult.pending,
    }),
  );
}
