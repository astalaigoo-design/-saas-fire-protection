import { InspectionItemResult } from "@prisma/client";

export type SubmitChecklistItem = {
  result: InspectionItemResult;
  notes: string | null;
};

export type SubmitValidationResult = { ok: true } | { ok: false; error: string };

export function validateChecklistItemsForSubmit(
  items: SubmitChecklistItem[],
): SubmitValidationResult {
  const pending = items.filter((item) => item.result === InspectionItemResult.pending);
  if (pending.length > 0) {
    return {
      ok: false,
      error: `Complete all checklist items (${pending.length} remaining).`,
    };
  }

  const failedWithoutNotes = items.filter(
    (item) =>
      item.result === InspectionItemResult.fail &&
      (!item.notes || item.notes.trim() === ""),
  );
  if (failedWithoutNotes.length > 0) {
    return { ok: false, error: "Every failed item needs a note." };
  }

  return { ok: true };
}

export function validateAssetChecksForSubmit(
  assetChecks: SubmitChecklistItem[],
): SubmitValidationResult {
  const failedWithoutNotes = assetChecks.filter(
    (check) =>
      check.result === InspectionItemResult.fail &&
      (!check.notes || check.notes.trim() === ""),
  );
  if (failedWithoutNotes.length > 0) {
    return { ok: false, error: "Every failed equipment item needs a note." };
  }

  return { ok: true };
}

export function inspectionHasFailedItems(items: SubmitChecklistItem[]): boolean {
  return items.some((item) => item.result === InspectionItemResult.fail);
}
