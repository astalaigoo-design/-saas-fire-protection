import { InspectionItemResult, OperatingMarket } from "@prisma/client";
import { getDefaultChecklistForMarket } from "@/lib/inspections/checklist-for-market";

export type InspectionChecklistCreateInput = {
  label: string;
  description: string;
  sortOrder: number;
  linkedTagNumber?: string | null;
  result: InspectionItemResult;
};

/** Build draft inspection checklist rows with market-specific standard citations. */
export function buildInspectionChecklistItems(
  inspectionTypeCode: string,
  operatingMarket: OperatingMarket = OperatingMarket.US,
): InspectionChecklistCreateInput[] {
  return getDefaultChecklistForMarket(inspectionTypeCode, operatingMarket).map(
    (item, index) => ({
      label: item.label,
      description: item.description,
      sortOrder: index,
      result: InspectionItemResult.pending,
    }),
  );
}
