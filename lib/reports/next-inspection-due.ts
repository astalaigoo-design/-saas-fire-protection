import type { RecurrenceInterval } from "@prisma/client";
import { advanceScheduledDate } from "@/lib/scheduling/recurrence";

export function calculateNextInspectionDue(
  completedAt: Date,
  recurrenceInterval: RecurrenceInterval | null,
  inspectionTypeCode: string,
): Date {
  if (recurrenceInterval) {
    return advanceScheduledDate(completedAt, recurrenceInterval, 1);
  }

  const next = new Date(completedAt);
  switch (inspectionTypeCode) {
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annual":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}
