import type { RecurrenceInterval } from "@prisma/client";
import { buildVisitDatesForRow } from "@/lib/scheduling/import-csv-resolve";
import type { RecurrenceOption } from "@/lib/scheduling/recurrence";

export type ScheduleImportCommitRow = {
  buildingId: string;
  inspectionTypeId: string;
  scheduledAt: Date;
  recurrence: RecurrenceOption;
};

export function scheduleImportSlotKey(
  buildingId: string,
  scheduledAt: Date,
  inspectionTypeId: string,
): string {
  return `${buildingId}|${scheduledAt.toISOString().slice(0, 16)}|${inspectionTypeId}`;
}

export type ScheduleImportCommitPlan = {
  scheduledRows: number;
  scheduledVisits: number;
  notifyTargets: Array<{ occurrenceCount: number }>;
  buildingIds: string[];
  slotKeys: string[];
};

/** Pure plan for CSV commit — mirrors transaction loop counts without Prisma. */
export function planScheduleImportCommit(rows: ScheduleImportCommitRow[]): ScheduleImportCommitPlan {
  const buildingIds = new Set<string>();
  const slotKeys: string[] = [];
  const notifyTargets: Array<{ occurrenceCount: number }> = [];
  let scheduledVisits = 0;

  for (const row of rows) {
    const dates = buildVisitDatesForRow(row.scheduledAt, row.recurrence);
    buildingIds.add(row.buildingId);
    notifyTargets.push({ occurrenceCount: dates.length });

    for (const occurrenceDate of dates) {
      scheduledVisits += 1;
      slotKeys.push(scheduleImportSlotKey(row.buildingId, occurrenceDate, row.inspectionTypeId));
    }
  }

  return {
    scheduledRows: rows.length,
    scheduledVisits,
    notifyTargets,
    buildingIds: Array.from(buildingIds),
    slotKeys,
  };
}

export function recurrenceIntervalForImport(
  recurrence: RecurrenceOption,
): RecurrenceInterval | null {
  if (recurrence === "none") return null;
  return recurrence;
}
