export type CalendarMonth = {
  year: number;
  month: number;
};

export function parseCalendarMonth(
  raw: Record<string, string | string[] | undefined>,
  now = new Date(),
): CalendarMonth {
  const pick = (key: string) => {
    const value = raw[key];
    return typeof value === "string" ? value : undefined;
  };

  const year = Number(pick("year") ?? now.getFullYear());
  const month = Number(pick("month") ?? now.getMonth() + 1);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { year, month: now.getMonth() + 1 };
  }

  return { year, month };
}

export function getMonthRangeFromParts(year: number, month: number): {
  start: Date;
  end: Date;
} {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export function shiftCalendarMonth(
  { year, month }: CalendarMonth,
  delta: number,
): CalendarMonth {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function combineDateAndTime(date: Date, time: string): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}
