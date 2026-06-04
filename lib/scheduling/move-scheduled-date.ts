import { parseDateInputValue } from "@/lib/scheduling/calendar";

/** Move an inspection to a new calendar day while preserving time-of-day. */
export function moveScheduledToDate(
  scheduledAt: Date,
  targetDate: string,
): Date | null {
  const day = parseDateInputValue(targetDate);
  if (!day) return null;
  const moved = new Date(day);
  moved.setHours(
    scheduledAt.getHours(),
    scheduledAt.getMinutes(),
    scheduledAt.getSeconds(),
    scheduledAt.getMilliseconds(),
  );
  return moved;
}
