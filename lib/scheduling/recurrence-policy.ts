import type { RecurrenceInterval } from "@prisma/client";

export const DUE_REMINDER_DAYS = 7;

const CADENCE_CODES = new Set(["monthly", "quarterly", "annual"]);

export function resolveRecurrenceInterval(
  recurrenceInterval: RecurrenceInterval | null,
  inspectionTypeCode: string,
): RecurrenceInterval | null {
  if (recurrenceInterval) return recurrenceInterval;
  if (CADENCE_CODES.has(inspectionTypeCode)) {
    return inspectionTypeCode as RecurrenceInterval;
  }
  return null;
}
