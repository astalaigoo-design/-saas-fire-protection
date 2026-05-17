import type { RecurrenceInterval } from "@prisma/client";

export type RecurrenceOption = "none" | RecurrenceInterval;

const occurrenceCounts: Record<RecurrenceInterval, number> = {
  monthly: 12,
  quarterly: 4,
  annual: 3,
};

export function getRecurrenceOccurrenceCount(interval: RecurrenceOption): number {
  if (interval === "none") return 1;
  return occurrenceCounts[interval];
}

export function advanceScheduledDate(
  base: Date,
  interval: RecurrenceInterval,
  index: number,
): Date {
  const date = new Date(base);
  switch (interval) {
    case "monthly":
      date.setMonth(date.getMonth() + index);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + index * 3);
      break;
    case "annual":
      date.setFullYear(date.getFullYear() + index);
      break;
  }
  return date;
}

export function buildRecurrenceSchedule(
  base: Date,
  interval: RecurrenceOption,
): Date[] {
  if (interval === "none") return [new Date(base)];

  const count = getRecurrenceOccurrenceCount(interval);
  return Array.from({ length: count }, (_, index) =>
    advanceScheduledDate(base, interval, index),
  );
}
