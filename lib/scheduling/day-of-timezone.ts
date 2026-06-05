/** IANA timezone for "today" on technician day-of SMS and My Jobs. */
export function getDayOfSmsTimeZone(): string {
  const configured = process.env.DAY_OF_SMS_TIMEZONE?.trim();
  return configured && configured.length > 0 ? configured : "America/New_York";
}

type ZonedYmd = { year: number; month: number; day: number };

function parseZonedYmd(date: Date, timeZone: string): ZonedYmd {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, day] = formatted.split("-").map((part) => Number.parseInt(part, 10));
  return { year, month, day };
}

function zonedYmdKey(parts: ZonedYmd): string {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

/** UTC offset in ms for `timeZone` at `instant` (positive = ahead of UTC). */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const utc = new Date(instant.toLocaleString("en-US", { timeZone: "UTC" }));
  const zoned = new Date(instant.toLocaleString("en-US", { timeZone }));
  return zoned.getTime() - utc.getTime();
}

/** Midnight at the start of the calendar day containing `instant` in `timeZone`. */
export function startOfZonedDay(instant: Date, timeZone: string): Date {
  const parts = parseZonedYmd(instant, timeZone);
  const noonUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
  const offsetMs = timeZoneOffsetMs(noonUtc, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) - offsetMs);
}

/** Exclusive end of the calendar day containing `instant` in `timeZone`. */
export function endOfZonedDay(instant: Date, timeZone: string): Date {
  const start = startOfZonedDay(instant, timeZone);
  const nextDayInstant = new Date(start.getTime() + 36 * 60 * 60 * 1000);
  return startOfZonedDay(nextDayInstant, timeZone);
}

export function getZonedDayBounds(
  instant = new Date(),
  timeZone = getDayOfSmsTimeZone(),
): { start: Date; end: Date } {
  return {
    start: startOfZonedDay(instant, timeZone),
    end: endOfZonedDay(instant, timeZone),
  };
}

export function isSameZonedCalendarDay(
  a: Date,
  b: Date,
  timeZone = getDayOfSmsTimeZone(),
): boolean {
  return zonedYmdKey(parseZonedYmd(a, timeZone)) === zonedYmdKey(parseZonedYmd(b, timeZone));
}

export function isScheduledOnZonedDay(
  scheduledAt: Date,
  reference = new Date(),
  timeZone = getDayOfSmsTimeZone(),
): boolean {
  const { start, end } = getZonedDayBounds(reference, timeZone);
  return scheduledAt >= start && scheduledAt < end;
}
